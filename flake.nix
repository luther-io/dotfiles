{
  description = "vluther dotfiles — home-manager flake";

  inputs = {
    # Tracking nixpkgs-unstable to match the tools expected by home.nix
    # (e.g. oxfmt, which is not yet in the release-25.11 branch). The
    # flake.lock pins this to a specific commit for reproducibility.
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    home-manager = {
      url = "github:nix-community/home-manager/master";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = { self, nixpkgs, home-manager, ... }:
    let
      system = "aarch64-darwin";
      pkgs = import nixpkgs {
        inherit system;
        config.allowUnfree = true;
      };
    in
    let
      mkHome =
        { username, homeDirectory }:
        home-manager.lib.homeManagerConfiguration {
          inherit pkgs;
          extraSpecialArgs = { inherit username homeDirectory; };
          modules = [ ./.config/home-manager/home.nix ];
        };
    in {
      # Stable selector for the primary account.
      homeConfigurations.vluther = mkHome {
        username = "vluther";
        homeDirectory = "/Users/vluther";
      };

      # Derives the account from the invoking login. Requires --impure.
      homeConfigurations.current =
        let
          username = builtins.getEnv "USER";
          homeDirectory = builtins.getEnv "HOME";
        in
        if username == "" || homeDirectory == "" then
          throw "homeConfigurations.current reads $USER/$HOME — run with --impure"
        else
          mkHome { inherit username homeDirectory; };
    };
}
