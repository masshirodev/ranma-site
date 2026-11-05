-- sumi for nvim: ink, washi paper and hinoki wood, the palette of ranma's
-- sumi theme (doc/examples/screenshot/themes/sumi.toml), on the legacy
-- syntax groups (nvim ships Rust's regex syntax, not a tree-sitter parser).
vim.cmd("highlight clear")
vim.g.colors_name = "sumi"

local c = {
  ink = "#17161a", -- the focused pane's ground (sumi's panes.active_bg)
  washi = "#e8e1d3",
  hinoki = "#d9a55b",
  ai = "#7b93c9",
  shu = "#e0533d",
  matcha = "#9db37a",
  kasumi = "#6e665c",
  sumi2 = "#2a2724",
  fuji = "#c79bb0", -- keywords: wisteria
  sora = "#8fb8b4", -- types: a pale teal
}

local function hi(group, spec)
  vim.api.nvim_set_hl(0, group, spec)
end

hi("Normal", { fg = c.washi, bg = "NONE" })
hi("LineNr", { fg = "#4a453f" })
hi("CursorLineNr", { fg = c.washi, bold = true })
hi("CursorLine", {})
hi("Cursor", { fg = c.ink, bg = c.washi })
hi("Visual", { bg = "#3a3631" })
hi("StatusLine", { fg = c.washi, bg = c.sumi2 })
hi("StatusLineNC", { fg = c.kasumi, bg = c.sumi2 })
hi("StatusMode", { fg = c.ink, bg = c.hinoki, bold = true })
hi("StatusDim", { fg = c.kasumi, bg = c.sumi2 })
hi("MsgArea", { fg = c.washi })
hi("EndOfBuffer", { fg = c.ink })
hi("NonText", { fg = "#3a3631" })
hi("Search", { fg = c.ink, bg = c.matcha })
hi("MatchParen", { fg = c.hinoki, bold = true })

hi("Comment", { fg = c.kasumi, italic = true })
hi("SpecialComment", { fg = c.kasumi, italic = true })
hi("Keyword", { fg = c.fuji })
hi("Conditional", { fg = c.fuji })
hi("Repeat", { fg = c.fuji })
hi("StorageClass", { fg = c.fuji })
hi("Statement", { fg = c.fuji })
hi("Type", { fg = c.sora })
hi("Structure", { fg = c.sora })
hi("Function", { fg = c.hinoki })
hi("Constant", { fg = c.fuji })
hi("Number", { fg = c.matcha })
hi("Boolean", { fg = c.matcha })
hi("String", { fg = c.matcha })
hi("Character", { fg = c.matcha })
hi("Operator", { fg = c.washi })
hi("Identifier", { fg = c.washi })
hi("Include", { fg = c.ai })
hi("Macro", { fg = c.ai })
hi("PreProc", { fg = c.ai })
hi("Special", { fg = c.ai })
hi("Delimiter", { fg = c.washi })
hi("Error", { fg = c.shu })
hi("Todo", { fg = c.hinoki, bold = true })
