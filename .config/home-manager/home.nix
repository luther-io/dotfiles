{ pkgs, username, homeDirectory, ... }:

{
  home.username = username;
  home.homeDirectory = homeDirectory;
  home.enableNixpkgsReleaseCheck = false;
  home.stateVersion = "25.11";

  programs.home-manager.enable = true;

  # ---------------------------------------------------------------------------
  # Packages
  # ---------------------------------------------------------------------------
  home.packages = with pkgs; [
    eza
    ripgrep
    glow
    jq
    gh
    neovim
    fnm
    pnpm
    go
    osv-scanner
    ruby
    direnv
    oxlint
    oxfmt
    nil

    # Nerd Fonts — keep only what Ghostty and iTerm2 actually render.
    # Ghostty: FiraCode Nerd Font. iTerm2: MesloLGS NF (meslo-lg) plus
    # the ConsolasForPowerline / powerline-symbols casks in the Brewfile.
    nerd-fonts.fira-code
    nerd-fonts.meslo-lg

  ];

  # ---------------------------------------------------------------------------
  # Session variables
  # ---------------------------------------------------------------------------
  home.sessionVariables = {
    EDITOR = "nvim";
    PNPM_HOME = "${homeDirectory}/Library/pnpm";
  };

  # ---------------------------------------------------------------------------
  # SSH
  # ---------------------------------------------------------------------------
  programs.ssh = {
    enable = true;
    enableDefaultConfig = false;
    settings."*" = {
      IdentityAgent = "\"~/Library/Group Containers/2BUA8C4S2C.com.1password/t/agent.sock\"";
    };
  };
  # ---------------------------------------------------------------------------
  # Git — SSH signing via 1Password, gh as https credential helper
  # ---------------------------------------------------------------------------
  programs.git = {
    enable = true;
    signing = {
      key = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIAMtjt4Zl7OHuqa2nidi85ch6Ghm3O7n0/d4rp9F3ieW";
      signByDefault = true;
      format = "ssh";
      signer = "/Applications/1Password.app/Contents/MacOS/op-ssh-sign";
    };
    settings = {
      user.name = "Vid Luther";
      user.email = "vidluther@users.noreply.github.com";
      tag.gpgsign = true;
      gpg.ssh.allowedSignersFile = "~/.ssh/allowed_signers";
      credential."https://github.com".helper = "!gh auth git-credential";
      credential."https://gist.github.com".helper = "!gh auth git-credential";
    };
    ignores = [
      ".zed/"
      "**/.claude/settings.local.json"
      ".config/zed/conversations/*"
      ".config/zed/prompts/*"
      ".plan.md"
    ];
  };

  home.file.".ssh/allowed_signers".text = ''
    vidluther@users.noreply.github.com ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIAMtjt4Zl7OHuqa2nidi85ch6Ghm3O7n0/d4rp9F3ieW
    vid@luther.io ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIAMtjt4Zl7OHuqa2nidi85ch6Ghm3O7n0/d4rp9F3ieW
  '';

  # ---------------------------------------------------------------------------
  # Fish shell
  # ---------------------------------------------------------------------------
  programs.fish = {
    enable = true;

    shellInit = ''
      # Multi-user daemon install: sets NIX_PROFILES, NIX_SSL_CERT_FILE, etc.
      if test -e /nix/var/nix/profiles/default/etc/profile.d/nix-daemon.fish
        source /nix/var/nix/profiles/default/etc/profile.d/nix-daemon.fish
      end
      fish_add_path /nix/var/nix/profiles/default/bin
      fish_add_path $HOME/.nix-profile/bin
      fish_add_path $HOME/.antigravity/antigravity/bin
      fish_add_path $HOME/.local/bin
      fish_add_path $HOME/bin
      fish_add_path $HOME/go/bin
      fish_add_path $HOME/.opencode/bin
      fish_add_path $PNPM_HOME
      fish_add_path $PNPM_HOME/bin
      set -gx OPENCODE_EXPERIMENTAL_OXFMT true
    '';

    # Keep GH_TOKEN/GITHUB_TOKEN in sync with gh's keyring token so CLI tools
    # never see a stale PAT. Interactive-only to keep script startup fast.
    interactiveShellInit = ''
      if command -q gh
        set -gx GH_TOKEN (gh auth token 2>/dev/null)
        set -gx GITHUB_TOKEN $GH_TOKEN
      end
    '';

    functions =
      let
        # Wrap an agent CLI so each account gets its own isolated
        # credential store (CLAUDE_CONFIG_DIR / CODEX_HOME).
        mkAgentAccount = { wraps, configDirEnv, configDir, description }: {
          inherit wraps description;
          body = ''
            set -lx ${configDirEnv} "${configDir}"
            mkdir -p "${configDir}"
            command ${wraps} $argv
          '';
        };

        claudeWork = mkAgentAccount {
          wraps = "claude";
          configDirEnv = "CLAUDE_CONFIG_DIR";
          configDir = "$HOME/.claude-work";
          description = "run Claude with the work account";
        };
        claudePersonal = mkAgentAccount {
          wraps = "claude";
          configDirEnv = "CLAUDE_CONFIG_DIR";
          configDir = "$HOME/.claude";
          description = "run Claude with the personal account";
        };
        codexPersonal = mkAgentAccount {
          wraps = "codex";
          configDirEnv = "CODEX_HOME";
          configDir = "$HOME/.codex-personal";
          description = "run Codex with the personal account";
        };
        codexWork = mkAgentAccount {
          wraps = "codex";
          configDirEnv = "CODEX_HOME";
          configDir = "$HOME/.codex-work";
          description = "run Codex with the work account";
        };
      in
      {
        vim = {
          wraps = "nvim";
          description = "alias vim nvim";
          body = "nvim $argv";
        };

        claude-work = claudeWork;
        work-claude = claudeWork;
        personal-claude = claudePersonal;

        # Keep personal and work Codex logins in separate credential stores.
        codex = codexPersonal;
        personal-codex = codexPersonal;
        work-codex = codexWork;
      };
  };

  # ---------------------------------------------------------------------------
  # Fish conf.d — fnm
  # ---------------------------------------------------------------------------
  xdg.configFile."fish/conf.d/fnm.fish".text = ''
    ${pkgs.fnm}/bin/fnm env --use-on-cd --version-file-strategy=recursive --shell fish | source
  '';

  # ---------------------------------------------------------------------------
  # Starship
  # ---------------------------------------------------------------------------
  programs.starship = {
    enable = true;
    enableFishIntegration = true;
    settings = {
      add_newline = true;

      format = builtins.concatStringsSep "" [
        "[](fg:#1f6feb)"
        "[  ](bg:#1f6feb fg:#ffffff)"
        "[](bg:#161b22 fg:#1f6feb)"
        "$directory"
        "[](fg:#161b22 bg:#0d1117)"
        "$git_branch"
        "$git_status"
        "[](fg:#0d1117)"
        "$fill"
        "[](fg:#0d1117)"
        "$nodejs"
        "$bun"
        "$rust"
        "$golang"
        "$php"
        "$python"
        "\n$character"
      ];

      fill.symbol = " ";

      directory = {
        style = "fg:#ffffff bg:#161b22";
        format = "[ $path ]($style)";
        truncation_length = 3;
        truncation_symbol = ".../";
        substitutions = {
          Documents = "󰈙 ";
          Downloads = " ";
          Music = " ";
          Pictures = " ";
        };
      };

      git_branch = {
        symbol = "";
        style = "bg:#0d1117";
        format = "[[ $symbol $branch ](fg:#3fb950 bg:#0d1117)]($style)";
      };

      git_status = {
        style = "bg:#0d1117";
        format = "[[($all_status$ahead_behind )](fg:#f78166 bg:#0d1117)]($style)";
      };

      nodejs = {
        symbol = "";
        style = "bg:#0d1117";
        format = "[[ $symbol ($version) ](fg:#58a6ff bg:#0d1117)]($style)";
      };

      bun = {
        symbol = "🥟";
        style = "bg:#0d1117";
        format = "[[ $symbol ($version) ](fg:#58a6ff bg:#0d1117)]($style)";
      };

      rust = {
        symbol = "";
        style = "bg:#0d1117";
        format = "[[ $symbol ($version) ](fg:#58a6ff bg:#0d1117)]($style)";
      };

      golang = {
        symbol = "";
        style = "bg:#0d1117";
        format = "[[ $symbol ($version) ](fg:#58a6ff bg:#0d1117)]($style)";
      };

      php = {
        symbol = "";
        style = "bg:#0d1117";
        format = "[[ $symbol ($version) ](fg:#58a6ff bg:#0d1117)]($style)";
      };

      python = {
        symbol = "";
        style = "bg:#0d1117";
        format = "[[ $symbol ($version) ](fg:#58a6ff bg:#0d1117)]($style)";
      };

      time = {
        disabled = true;
        time_format = "%R";
        style = "bg:#161b22";
        format = "[[  $time ](fg:#79c0ff bg:#161b22)]($style)";
      };

      character = {
        success_symbol = "[➜](bold green)";
        error_symbol = "[➜](bold red)";
      };

      package.disabled = true;
    };
  };

  # ---------------------------------------------------------------------------
  # gh CLI
  # ---------------------------------------------------------------------------
  xdg.configFile."gh/config.yml".text = ''
    version: 1
    git_protocol: ssh
    editor:
    prompt: enabled
    prefer_editor_prompt: disabled
    pager:
    aliases:
        co: pr checkout
    http_unix_socket:
    browser:
    color_labels: disabled
    accessible_colors: disabled
    accessible_prompter: disabled
    spinner: enabled
  '';

  xdg.configFile."gh/hosts.yml".text = ''
    github.com:
        git_protocol: ssh
        users:
            vidluther:
        user: vidluther
  '';

  xdg.configFile."1Password/ssh/agent.toml".text = ''
    [[ssh-keys]]
    vault = "Private"
    [[ssh-keys]]
    vault = "Employee"
    [[ssh-keys]]
    vault = "SSH"
  '';
}
