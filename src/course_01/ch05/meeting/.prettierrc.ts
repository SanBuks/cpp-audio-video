import { type Config } from "prettier";

const config: Config = {
  semi: false,                          // 行尾不加分号
  singleQuote: true,                    // 使用单引号
  trailingComma: 'all',                 // 多行时尽可能加尾随逗号
  printWidth: 120,                      // 每行最大字符数
  tabWidth: 2,                          // 缩进 2 个空格
  useTabs: false,                       // 不用 Tab
  arrowParens: 'always',                // 单参数箭头函数不省略括号
  vueIndentScriptAndStyle: true,        // 缩进 <script> 和 <style> 内部
  bracketSameLine: false,               // Vue 模板中 > 是否换行
  htmlWhitespaceSensitivity: 'ignore',  // 忽略 HTML 空格敏感度
  endOfLine: 'auto',                    // 自动适配换行符（lf/crlf）
}

export default config;