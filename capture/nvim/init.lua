-- The staged home's nvim (capture/stage.sh): sumi's colours, line numbers,
-- and a statusline like the design's, a hinoki NORMAL pill, the file, the
-- filetype and position on the right. Nothing here is ranma's: it is what a
-- program in a pane looks like.
vim.opt.termguicolors = true
vim.opt.number = true
vim.opt.numberwidth = 4
vim.opt.cursorline = true
vim.opt.cursorlineopt = "number"
vim.opt.laststatus = 2
vim.opt.showmode = false
vim.opt.ruler = false
vim.opt.shortmess:append("I")
vim.opt.fillchars = { eob = " " }
vim.opt.guicursor = "n-v-c:block,i:ver25"
vim.cmd.colorscheme("sumi")

local modes = { n = "NORMAL", i = "INSERT", v = "VISUAL", V = "V-LINE", c = "COMMAND" }
function _G.sumi_status()
  local m = modes[vim.fn.mode()] or vim.fn.mode()
  return table.concat({
    "%#StatusMode# ", m, " %#StatusLine# %f%m",
    "%=",
    "%#StatusDim#%{&filetype}  %#StatusLine#%l:%c ",
  })
end
vim.opt.statusline = "%!v:lua.sumi_status()"
