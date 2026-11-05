vim.opt.clipboard = "unnamedplus"

vim.g.loaded_netrw = 1
vim.g.loaded_netrwPlugin = 1

vim.pack.add({ "https://github.com/nvim-tree/nvim-tree.lua" }, { confirm = false })
require("nvim-tree").setup()

vim.keymap.set("n", "<leader>e", "<cmd>NvimTreeToggle<cr>")
