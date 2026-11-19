import log4js from 'log4js';

// 统一导出 Logger 类型, 方便工具函数引用
export type Logger = log4js.Logger;

// 获取 logger 的工厂函数 (默认)
export function getLogger(): Logger {
  return log4js.getLogger()
}
