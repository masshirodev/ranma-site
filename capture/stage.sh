#!/bin/sh
# Stages the world the captures are recorded in: a home of its own, so no
# real session, history or dotfile shows up, and the look is ranma's sumi
# example and nothing of the machine's.
#
#   capture/stage.sh WORLD RANMA_DIR    # prints the home it made
#
# - ranma's config is doc/examples/screenshot from RANMA_DIR, as a visitor can
#   copy it, plus what a recording needs (no plugin manager cloning itself
#   mid-take, no restore) and mobile.ranma for the mobile view.
# - zsh marks its commands (OSC 133, the command line in the mark), so the
#   example's command_finished toast fires, and titles each pane the way the
#   design does: `zsh ~/src/ranma`, then the command while it runs.
# - nvim is coloured from sumi's palette (capture/nvim), with a statusline of
#   its own: the editor in the screenshot is a program in a pane, not ranma.
# - ~/src/ranma is a clone of RANMA_DIR to work in.
set -eu
world=$1
ranma_dir=$2
here=$(cd "$(dirname "$0")" && pwd)

rm -rf "$world"
home=$world/home
mkdir -p "$home/.config/ranma" "$home/.config/btop" "$home/src" "$world/run"
chmod 700 "$world/run"

# ranma: the example whole, then the recording's own settings after it.
cp -r "$ranma_dir/doc/examples/screenshot/." "$home/.config/ranma/"
cat >> "$home/.config/ranma/init.lua" <<'LUA'

-- Added by ranma-site's capture/stage.sh, not part of the example: hako would
-- clone itself from GitHub on the first start, mid-recording, and a restored
-- snapshot would bring back an earlier take.
ranma.set { plugin_manager = "none", restore = "off" }
LUA
# The mobile view is a plugin (mobile.ranma), loaded as any package is. The
# copy hako keeps on this machine, else GitHub.
mobile=${MOBILE_RANMA:-$HOME/.local/share/ranma/hako/mobile.ranma}
[ -d "$mobile" ] || mobile=https://github.com/masshirodev/mobile.ranma
case $mobile in /*) mobile=file://$mobile ;; esac
git clone -q --depth 1 "$mobile" "$home/.config/ranma/pack/plugins/start/mobile.ranma"

# btop: the CPU box and its load only. Temperatures, the GPU, the uptime and
# the model are this machine's, not ranma's, and none of a visitor's business.
cat > "$home/.config/btop/btop.conf" <<'CONF'
shown_boxes = "cpu"
update_ms = 1000
color_theme = "TTY"
check_temp = false
show_gpu_info = "Off"
show_uptime = false
show_cpu_freq = false
custom_cpu_name = "cpu"
CONF

cp -r "$here/nvim" "$home/.config/nvim"
cp "$here/zshrc" "$home/.zshrc"

git clone -q --depth 60 "file://$ranma_dir" "$home/src/ranma"
echo "$home"
