-- Leader must be set before any <leader> mapping.
vim.g.mapleader = " "
vim.g.maplocalleader = "\\"

vim.g.loaded_netrw = 1
vim.g.loaded_netrwPlugin = 1

-- Options
local o = vim.opt
o.clipboard = "unnamedplus"
o.termguicolors = true
o.number = true
o.cursorline = true
o.scrolloff = 8
o.signcolumn = "yes"
o.ignorecase = true
o.smartcase = true
o.undofile = true
o.swapfile = false
o.splitright = true
o.splitbelow = true
o.mouse = "a"
o.confirm = true
o.winborder = "rounded"
o.updatetime = 250
o.autoread = true

-- Plugins
vim.pack.add({
	"https://github.com/nvim-tree/nvim-tree.lua",
	"https://github.com/akinsho/bufferline.nvim",
	"https://github.com/nvim-mini/mini.clue",
}, { confirm = false })

require("nvim-tree").setup()

require("bufferline").setup({
	options = {
		offsets = {
			{ filetype = "NvimTree", text = "Files", separator = true },
		},
	},
})

local miniclue = require("mini.clue")
miniclue.setup({
	triggers = {
		{ mode = "n", keys = "<Leader>" },
		{ mode = "x", keys = "<Leader>" },
		{ mode = "n", keys = "g" },
		{ mode = "x", keys = "g" },
		{ mode = "n", keys = "z" },
		{ mode = "x", keys = "z" },
		{ mode = "n", keys = "'" },
		{ mode = "n", keys = "`" },
		{ mode = "n", keys = '"' },
		{ mode = "x", keys = '"' },
		{ mode = "i", keys = "<C-r>" },
		{ mode = "c", keys = "<C-r>" },
		{ mode = "n", keys = "<C-w>" },
	},
	clues = {
		{ mode = "n", keys = "<Leader>b", desc = "+buffer" },
		miniclue.gen_clues.builtin_completion(),
		miniclue.gen_clues.g(),
		miniclue.gen_clues.marks(),
		miniclue.gen_clues.registers(),
		miniclue.gen_clues.windows(),
		miniclue.gen_clues.z(),
	},
	window = {
		delay = 300,
		-- Size to fit the longest description, anchored top-right.
		config = { width = "auto", anchor = "NE", row = "auto", col = "auto" },
	},
})

-- Keymaps
local map = vim.keymap.set
map("n", "<leader>e", "<cmd>NvimTreeToggle<cr>", { desc = "File tree" })
map("n", "<S-h>", "<cmd>BufferLineCyclePrev<cr>", { desc = "Previous buffer" })
map("n", "<S-l>", "<cmd>BufferLineCycleNext<cr>", { desc = "Next buffer" })
map("n", "<leader>bd", "<cmd>bdelete<cr>", { desc = "Close buffer" })
map("i", "jk", "<Esc>", { desc = "Leave insert mode" })
map("n", "<C-s>", "<cmd>write<cr>", { desc = "Save" })
map({ "i", "x" }, "<C-s>", "<Esc><cmd>write<cr>", { desc = "Save" })
map("n", "<Esc>", "<cmd>nohlsearch<cr><Esc>", { desc = "Clear search highlight" })

-- Autocmds
local group = vim.api.nvim_create_augroup("user", { clear = true })
local au = function(ev, opts)
	vim.api.nvim_create_autocmd(ev, vim.tbl_extend("force", { group = group }, opts))
end

-- q closes help, man, quickfix and similar windows.
au("FileType", {
	pattern = { "help", "man", "qf", "checkhealth", "nvim-pack" },
	callback = function(ev)
		vim.bo[ev.buf].buflisted = false
		map("n", "q", "<cmd>close<cr>", { buffer = ev.buf, silent = true, desc = "Close window" })
	end,
})

-- Reopen a file on the line it was last left.
au("BufReadPost", {
	callback = function(ev)
		if vim.bo[ev.buf].filetype == "gitcommit" then return end
		local mark = vim.api.nvim_buf_get_mark(ev.buf, '"')
		if mark[1] > 0 and mark[1] <= vim.api.nvim_buf_line_count(ev.buf) then
			pcall(vim.api.nvim_win_set_cursor, 0, mark)
		end
	end,
})

-- Reload files changed on disk (e.g. by a coding agent).
au({ "FocusGained", "BufEnter", "TermClose", "TermLeave" }, {
	callback = function()
		if vim.o.buftype == "" then vim.cmd("checktime") end
	end,
})

-- Also reload the moment a watched file changes, even while Neovim is unfocused.
local watchers = {}
local function watch(buf)
	local name = vim.api.nvim_buf_get_name(buf)
	if name == "" or vim.bo[buf].buftype ~= "" or watchers[buf] then return end
	local handle = vim.uv.new_fs_event()
	if not handle then return end
	local timer = vim.uv.new_timer()
	local ok = handle:start(name, {}, function()
		timer:stop()
		timer:start(100, 0, vim.schedule_wrap(function()
			if vim.api.nvim_buf_is_valid(buf) then vim.cmd("checktime " .. buf) end
			-- Tools often replace the file (rename over it); re-arm on the new inode.
			if watchers[buf] then
				watchers[buf].handle:stop()
				watchers[buf] = nil
				watch(buf)
			end
		end))
	end)
	if ok then
		watchers[buf] = { handle = handle, timer = timer }
	else
		handle:close()
		timer:close()
	end
end
au({ "BufReadPost", "BufWritePost" }, { callback = function(ev) watch(ev.buf) end })
au({ "BufDelete", "BufWipeout" }, {
	callback = function(ev)
		local w = watchers[ev.buf]
		if w then
			w.handle:stop()
			w.timer:stop()
			watchers[ev.buf] = nil
		end
	end,
})
