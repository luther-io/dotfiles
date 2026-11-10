#!/bin/bash
set -f
# Claude Code statusLine — starship-themed, single line, width-aware.
#  opus-4-7·high │ ✍ 76% │ workspace  main* │ ✎ session │  12m │ ◇ concise │ ◐ thinking
#
# Drops segments in this order on narrow terminals:
#   session name → duration → style/effort → thinking → git dirty marker

input=$(cat)
if [ -z "$input" ]; then
    printf "Claude"
    exit 0
fi

# ── Palette: GitHub theme, matching the Starship prompt in home.nix ─
accent='\033[38;2;31;111;235m'    # #1f6feb  starship accent block
git_green='\033[38;2;63;185;80m'  # #3fb950  starship git_branch fg
warn='\033[38;2;247;129;102m'     # #f78166  starship git_status fg
info='\033[38;2;121;192;255m'     # #79c0ff  starship time fg
white='\033[38;2;255;255;255m'    # starship directory fg
red='\033[38;2;255;85;85m'
yellow='\033[38;2;230;200;0m'
orange='\033[38;2;255;176;85m'
green='\033[38;2;0;175;80m'
magenta='\033[38;2;180;140;255m'
dim='\033[2m'
reset='\033[0m'

sep=" ${dim}│${reset} "

# ── Helpers ─────────────────────────────────────────────────────
# Visible column width after rendering ANSI escapes.
# - printf %b expands literal `\033[...m` into real ESC sequences.
# - sed strips them.
# - ${#stripped} counts characters.
visible_len() {
    local rendered stripped
    rendered=$(printf "%b" "$1")
    stripped=$(printf "%s" "$rendered" | sed $'s/\E\\[[0-9;]*[A-Za-z]//g')
    echo "${#stripped}"
}

color_for_pct() {
    local pct=$1
    if [ "$pct" -ge 90 ]; then printf "$red"
    elif [ "$pct" -ge 70 ]; then printf "$yellow"
    elif [ "$pct" -ge 50 ]; then printf "$orange"
    else printf "$green"
    fi
}

iso_to_epoch() {
    local iso_str="$1" epoch
    epoch=$(date -d "${iso_str}" +%s 2>/dev/null)
    [ -n "$epoch" ] && { echo "$epoch"; return 0; }
    local stripped="${iso_str%%.*}"
    stripped="${stripped%%Z}"
    stripped="${stripped%%+*}"
    stripped="${stripped%%-[0-9][0-9]:[0-9][0-9]}"
    if [[ "$iso_str" == *"Z"* ]] || [[ "$iso_str" == *"+00:00"* ]] || [[ "$iso_str" == *"-00:00"* ]]; then
        epoch=$(env TZ=UTC date -j -f "%Y-%m-%dT%H:%M:%S" "$stripped" +%s 2>/dev/null)
    else
        epoch=$(date -j -f "%Y-%m-%dT%H:%M:%S" "$stripped" +%s 2>/dev/null)
    fi
    [ -n "$epoch" ] && { echo "$epoch"; return 0; }
    return 1
}

# ── Terminal width detection ────────────────────────────────────
# Claude Code spawns this script with a controlling TTY, so /dev/tty works.
# The outer { ... } 2>/dev/null swallows the shell's own redirect error when
# /dev/tty isn't available (e.g. when piping in tests).
cols=$( { stty size </dev/tty | awk '{print $2}'; } 2>/dev/null )
[ -z "$cols" ] && cols="${COLUMNS:-80}"
[ "$cols" -lt 1 ] 2>/dev/null && cols=80

# Claude Code's renderer reserves some right-edge chrome; padding right up to
# `cols` causes truncation and can consume the row budget,
# eating subsequent lines. Reserve a buffer so we never write the rightmost
# few columns. Tune via $CLAUDE_STATUSLINE_RIGHT_MARGIN.
right_margin="${CLAUDE_STATUSLINE_RIGHT_MARGIN:-6}"
usable_cols=$(( cols - right_margin ))
[ "$usable_cols" -lt 20 ] && usable_cols=20

# ── Extract JSON ────────────────────────────────────────────────
model_name=$(echo "$input"   | jq -r '.model.display_name // "Claude"' 2>/dev/null)
used_pct=$(echo "$input"     | jq -r '.context_window.used_percentage // 0' 2>/dev/null)
cwd=$(echo "$input"          | jq -r '.workspace.current_dir // .cwd // ""' 2>/dev/null)
session_name=$(echo "$input" | jq -r '.session.name // empty' 2>/dev/null)
session_start=$(echo "$input"| jq -r '.session.start_time // empty' 2>/dev/null)

[ -z "$model_name" ] && model_name="Claude"
[[ "$used_pct" =~ ^[0-9]+$ ]] || used_pct=0

[ -z "$cwd" ] || [ "$cwd" = "null" ] && cwd=$(pwd)
dir_name=$(basename "$cwd")

# ── Git ─────────────────────────────────────────────────────────
branch=""
dirty_marker=""
if git -C "$cwd" rev-parse --git-dir >/dev/null 2>&1; then
    branch=$(git -C "$cwd" --no-optional-locks symbolic-ref --short HEAD 2>/dev/null \
             || git -C "$cwd" --no-optional-locks rev-parse --short HEAD 2>/dev/null)
    if [ -n "$branch" ]; then
        if [ -n "$(git -C "$cwd" --no-optional-locks status --porcelain 2>/dev/null | head -1)" ]; then
            dirty_marker="${warn}*${reset}"
        fi
    fi
fi

# ── Session duration ────────────────────────────────────────────
session_duration=""
if [ -n "$session_start" ] && [ "$session_start" != "null" ]; then
    start_epoch=$(iso_to_epoch "$session_start")
    if [ -n "$start_epoch" ]; then
        now_epoch=$(date +%s)
        elapsed=$(( now_epoch - start_epoch ))
        [ "$elapsed" -lt 0 ] && elapsed=0
        if [ "$elapsed" -ge 3600 ]; then
            session_duration="$(( elapsed / 3600 ))h$(( (elapsed % 3600) / 60 ))m"
        elif [ "$elapsed" -ge 60 ]; then
            session_duration="$(( elapsed / 60 ))m"
        else
            session_duration="${elapsed}s"
        fi
    fi
fi

# ── Thinking flag, output style, effort ─────────────────────────
# Output style can change mid-session, so prefer the stdin payload and fall back
# to settings.json. Effort level isn't in the payload — settings.json only.
thinking_on=false
output_style=$(echo "$input" | jq -r '.output_style.name // empty' 2>/dev/null)
effort=""
settings_path="${CLAUDE_CONFIG_DIR:-$HOME/.claude}/settings.json"
if [ -f "$settings_path" ]; then
    # IFS=tab, not the default — style names may contain spaces.
    IFS=$'\t' read -r thinking_val settings_style effort <<<"$(jq -r '[(.alwaysThinkingEnabled // false), (.outputStyle // "-"), (.effortLevel // "-")] | @tsv' "$settings_path" 2>/dev/null)"
    [ "$thinking_val" = "true" ] && thinking_on=true
    [ -z "$output_style" ] && [ "$settings_style" != "-" ] && output_style="$settings_style"
    [ "$effort" = "-" ] && effort=""
    effort=$(printf "%s" "$effort" | tr '[:upper:]' '[:lower:]')
fi

# ── Build line 1 with progressive drop ──────────────────────────
seg_model="${accent} ${model_name}${reset}"
[ -n "$effort" ] && seg_model+="${dim}·${reset}${accent}${effort}${reset}"
pct_color=$(color_for_pct "$used_pct")
seg_pct="${dim}✍${reset} ${pct_color}${used_pct}%${reset}"
seg_dir="${white}${dir_name}${reset}"
seg_branch=""
[ -n "$branch" ] && seg_branch=" ${git_green} ${branch}${reset}"
seg_session=""
[ -n "$session_name" ] && [ "$session_name" != "null" ] && seg_session="${white}✎ ${session_name}${reset}"
seg_duration=""
[ -n "$session_duration" ] && seg_duration="${dim}${reset} ${white}${session_duration}${reset}"
if $thinking_on; then
    seg_thinking="${magenta}◐ thinking${reset}"
else
    seg_thinking="${dim}◑ thinking${reset}"
fi
seg_style=""
style_txt=$(printf "%s" "$output_style" | tr '[:upper:]' '[:lower:]')
[ -n "$style_txt" ] && seg_style="${info}◇ ${style_txt}${reset}"

# Build the status line with optional lower-priority segments.
build_left() {
    local inc_session=$1 inc_duration=$2 inc_style=$3 inc_thinking=$4 inc_dirty=$5
    local out="${seg_model}${sep}${seg_pct}${sep}${seg_dir}"
    if [ -n "$seg_branch" ]; then
        out+="$seg_branch"
        [ "$inc_dirty" = "1" ] && [ -n "$dirty_marker" ] && out+="$dirty_marker"
    fi
    [ "$inc_session"  = "1" ] && [ -n "$seg_session"  ] && out+="${sep}${seg_session}"
    [ "$inc_duration" = "1" ] && [ -n "$seg_duration" ] && out+="${sep}${seg_duration}"
    [ "$inc_style"    = "1" ] && [ -n "$seg_style"    ] && out+="${sep}${seg_style}"
    [ "$inc_thinking" = "1" ] && out+="${sep}${seg_thinking}"
    printf "%s" "$out"
}

# Progressive drop on the left in user's chosen order.
inc_session=1; inc_duration=1; inc_style=1; inc_thinking=1; inc_dirty=1
left=$(build_left $inc_session $inc_duration $inc_style $inc_thinking $inc_dirty)
for drop in session duration style thinking dirty; do
    [ "$(visible_len "$left")" -le "$usable_cols" ] && break
    case "$drop" in
        session)  inc_session=0 ;;
        duration) inc_duration=0 ;;
        style)    inc_style=0 ;;
        thinking) inc_thinking=0 ;;
        dirty)    inc_dirty=0 ;;
    esac
    left=$(build_left $inc_session $inc_duration $inc_style $inc_thinking $inc_dirty)
done

# ── Output ──────────────────────────────────────────────────────
printf "%b" "$left"
exit 0
