if (typeof Promise !== "undefined" && !Promise.prototype.finally) {
  Promise.prototype.finally = function(callback) {
    const promise = this.constructor;
    return this.then(
      (value) => promise.resolve(callback()).then(() => value),
      (reason) => promise.resolve(callback()).then(() => {
        throw reason;
      })
    );
  };
}
;
if (typeof uni !== "undefined" && uni && uni.requireGlobal) {
  const global = uni.requireGlobal();
  ArrayBuffer = global.ArrayBuffer;
  Int8Array = global.Int8Array;
  Uint8Array = global.Uint8Array;
  Uint8ClampedArray = global.Uint8ClampedArray;
  Int16Array = global.Int16Array;
  Uint16Array = global.Uint16Array;
  Int32Array = global.Int32Array;
  Uint32Array = global.Uint32Array;
  Float32Array = global.Float32Array;
  Float64Array = global.Float64Array;
  BigInt64Array = global.BigInt64Array;
  BigUint64Array = global.BigUint64Array;
}
;
if (uni.restoreGlobal) {
  uni.restoreGlobal(Vue, weex, plus, setTimeout, clearTimeout, setInterval, clearInterval);
}
(function(vue) {
  "use strict";
  const defineMixin = (options) => {
    return options;
  };
  const TransitionDefaultProps = {
    // transition动画组件的props
    transition: {
      show: false,
      mode: "fade",
      duration: "300",
      timingFunction: "ease-out"
    }
  };
  const version = "3";
  {
    console.log(`
 %c uview-plus V${version} %c https://uview-plus.jiangruyi.com/ 

`, "color: #ffffff; background: #3c9cff; padding:5px 0;", "color: #3c9cff;background: #ffffff; padding:5px 0;");
  }
  const config = {
    v: version,
    version,
    // 主题名称
    type: [
      "primary",
      "success",
      "info",
      "error",
      "warning"
    ],
    // 颜色部分，本来可以通过scss的:export导出供js使用，但是奈何nvue不支持
    color: {
      "u-primary": "#2979ff",
      "u-warning": "#ff9900",
      "u-success": "#19be6b",
      "u-error": "#fa3534",
      "u-info": "#909399",
      "u-main-color": "#303133",
      "u-content-color": "#606266",
      "u-tips-color": "#909399",
      "u-light-color": "#c0c4cc",
      "up-primary": "#2979ff",
      "up-warning": "#ff9900",
      "up-success": "#19be6b",
      "up-error": "#fa3534",
      "up-info": "#909399",
      "up-main-color": "#303133",
      "up-content-color": "#606266",
      "up-tips-color": "#909399",
      "up-light-color": "#c0c4cc"
    },
    // 字体图标地址
    iconUrl: "https://at.alicdn.com/t/font_2225171_8kdcwk4po24.ttf",
    // 自定义图标
    customIcon: {
      family: "",
      url: ""
    },
    customIcons: {},
    // 自定义图标与unicode对应关系
    // 默认单位，可以通过配置为rpx，那么在用于传入组件大小参数为数值时，就默认为rpx
    unit: "px",
    // 是否由运行时主题同步原生导航栏、页面背景、tabBar等全局UI
    nativeThemeSync: false,
    // 拦截器
    interceptor: {
      navbarLeftClick: null
    },
    // 只加载一次字体
    loadFontOnce: true
  };
  const zIndex = {
    toast: 10090,
    noNetwork: 10080,
    // popup包含popup，actionsheet，keyboard，picker的值
    popup: 10075,
    mask: 10070,
    navbar: 980,
    topTips: 975,
    sticky: 970,
    indexListSticky: 965
  };
  const color$2 = {
    primary: "#3c9cff",
    info: "#909399",
    default: "#909399",
    warning: "#f9ae3d",
    error: "#f56c6c",
    success: "#5ac725",
    mainColor: "#303133",
    contentColor: "#606266",
    tipsColor: "#909399",
    lightColor: "#c0c4cc",
    borderColor: "#e4e7ed"
  };
  const { toString } = Object.prototype;
  function isArray(val) {
    return toString.call(val) === "[object Array]";
  }
  function isObject(val) {
    return val !== null && typeof val === "object";
  }
  function isDate(val) {
    return toString.call(val) === "[object Date]";
  }
  function isURLSearchParams(val) {
    return typeof URLSearchParams !== "undefined" && val instanceof URLSearchParams;
  }
  function forEach(obj, fn) {
    if (obj === null || typeof obj === "undefined") {
      return;
    }
    if (typeof obj !== "object") {
      obj = [obj];
    }
    if (isArray(obj)) {
      for (let i = 0, l = obj.length; i < l; i++) {
        fn.call(null, obj[i], i, obj);
      }
    } else {
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          fn.call(null, obj[key], key, obj);
        }
      }
    }
  }
  function isPlainObject$1(obj) {
    return Object.prototype.toString.call(obj) === "[object Object]";
  }
  function deepMerge$1() {
    const result = {};
    function assignValue(val, key) {
      if (typeof result[key] === "object" && typeof val === "object") {
        result[key] = deepMerge$1(result[key], val);
      } else if (typeof val === "object") {
        result[key] = deepMerge$1({}, val);
      } else {
        result[key] = val;
      }
    }
    for (let i = 0, l = arguments.length; i < l; i++) {
      forEach(arguments[i], assignValue);
    }
    return result;
  }
  function isUndefined(val) {
    return typeof val === "undefined";
  }
  function encode(val) {
    return encodeURIComponent(val).replace(/%40/gi, "@").replace(/%3A/gi, ":").replace(/%24/g, "$").replace(/%2C/gi, ",").replace(/%20/g, "+").replace(/%5B/gi, "[").replace(/%5D/gi, "]");
  }
  function buildURL(url2, params2) {
    if (!params2) {
      return url2;
    }
    let serializedParams;
    if (isURLSearchParams(params2)) {
      serializedParams = params2.toString();
    } else {
      const parts = [];
      forEach(params2, (val, key) => {
        if (val === null || typeof val === "undefined") {
          return;
        }
        if (isArray(val)) {
          key = `${key}[]`;
        } else {
          val = [val];
        }
        forEach(val, (v) => {
          if (isDate(v)) {
            v = v.toISOString();
          } else if (isObject(v)) {
            v = JSON.stringify(v);
          }
          parts.push(`${encode(key)}=${encode(v)}`);
        });
      });
      serializedParams = parts.join("&");
    }
    if (serializedParams) {
      const hashmarkIndex = url2.indexOf("#");
      if (hashmarkIndex !== -1) {
        url2 = url2.slice(0, hashmarkIndex);
      }
      url2 += (url2.indexOf("?") === -1 ? "?" : "&") + serializedParams;
    }
    return url2;
  }
  function isAbsoluteURL(url2) {
    return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url2);
  }
  function combineURLs(baseURL, relativeURL) {
    return relativeURL ? `${baseURL.replace(/\/+$/, "")}/${relativeURL.replace(/^\/+/, "")}` : baseURL;
  }
  function buildFullPath(baseURL, requestedURL) {
    if (baseURL && !isAbsoluteURL(requestedURL)) {
      return combineURLs(baseURL, requestedURL);
    }
    return requestedURL;
  }
  function settle(resolve, reject, response) {
    const { validateStatus } = response.config;
    const status = response.statusCode;
    if (status && (!validateStatus || validateStatus(status))) {
      resolve(response);
    } else {
      reject(response);
    }
  }
  const mergeKeys$1 = (keys, config2) => {
    const config3 = {};
    keys.forEach((prop) => {
      if (!isUndefined(config2[prop])) {
        config3[prop] = config2[prop];
      }
    });
    return config3;
  };
  const adapter = (config2) => new Promise((resolve, reject) => {
    const fullPath = buildURL(buildFullPath(config2.baseURL, config2.url), config2.params);
    const _config = {
      url: fullPath,
      header: config2.header,
      complete: (response) => {
        config2.fullPath = fullPath;
        response.config = config2;
        try {
          if (typeof response.data === "string") {
            response.data = JSON.parse(response.data);
          }
        } catch (e) {
        }
        settle(resolve, reject, response);
      }
    };
    let requestTask;
    if (config2.method === "UPLOAD") {
      delete _config.header["content-type"];
      delete _config.header["Content-Type"];
      const otherConfig = {
        filePath: config2.filePath,
        name: config2.name
      };
      const optionalKeys = [
        "files",
        "timeout",
        "formData"
      ];
      requestTask = uni.uploadFile({ ..._config, ...otherConfig, ...mergeKeys$1(optionalKeys, config2) });
    } else if (config2.method === "DOWNLOAD") {
      if (!isUndefined(config2.timeout)) {
        _config.timeout = config2.timeout;
      }
      requestTask = uni.downloadFile(_config);
    } else {
      const optionalKeys = [
        "data",
        "method",
        "timeout",
        "dataType",
        "responseType",
        "sslVerify",
        "firstIpv4"
      ];
      requestTask = uni.request({ ..._config, ...mergeKeys$1(optionalKeys, config2) });
    }
    if (config2.getTask) {
      config2.getTask(requestTask, config2);
    }
  });
  const dispatchRequest = (config2) => adapter(config2);
  function InterceptorManager() {
    this.handlers = [];
  }
  InterceptorManager.prototype.use = function use(fulfilled, rejected) {
    this.handlers.push({
      fulfilled,
      rejected
    });
    return this.handlers.length - 1;
  };
  InterceptorManager.prototype.eject = function eject(id) {
    if (this.handlers[id]) {
      this.handlers[id] = null;
    }
  };
  InterceptorManager.prototype.forEach = function forEach2(fn) {
    this.handlers.forEach((h) => {
      if (h !== null) {
        fn(h);
      }
    });
  };
  const mergeKeys = (keys, globalsConfig, config2) => {
    const config3 = {};
    keys.forEach((prop) => {
      if (!isUndefined(config2[prop])) {
        config3[prop] = config2[prop];
      } else if (!isUndefined(globalsConfig[prop])) {
        config3[prop] = globalsConfig[prop];
      }
    });
    return config3;
  };
  const mergeConfig = (globalsConfig, config2 = {}) => {
    const method = config2.method || globalsConfig.method || "GET";
    let config3 = {
      baseURL: globalsConfig.baseURL || "",
      method,
      url: config2.url || "",
      params: config2.params || {},
      custom: { ...globalsConfig.custom || {}, ...config2.custom || {} },
      header: deepMerge$1(globalsConfig.header || {}, config2.header || {})
    };
    const defaultToConfig2Keys = ["getTask", "validateStatus"];
    config3 = { ...config3, ...mergeKeys(defaultToConfig2Keys, globalsConfig, config2) };
    if (method === "DOWNLOAD") {
      if (!isUndefined(config2.timeout)) {
        config3.timeout = config2.timeout;
      } else if (!isUndefined(globalsConfig.timeout)) {
        config3.timeout = globalsConfig.timeout;
      }
    } else if (method === "UPLOAD") {
      delete config3.header["content-type"];
      delete config3.header["Content-Type"];
      const uploadKeys = [
        "files",
        "filePath",
        "name",
        "timeout",
        "formData"
      ];
      uploadKeys.forEach((prop) => {
        if (!isUndefined(config2[prop])) {
          config3[prop] = config2[prop];
        }
      });
      if (isUndefined(config3.timeout) && !isUndefined(globalsConfig.timeout)) {
        config3.timeout = globalsConfig.timeout;
      }
    } else {
      const defaultsKeys = [
        "data",
        "timeout",
        "dataType",
        "responseType",
        "sslVerify",
        "firstIpv4"
      ];
      config3 = { ...config3, ...mergeKeys(defaultsKeys, globalsConfig, config2) };
    }
    return config3;
  };
  const defaults = {
    baseURL: "",
    header: {},
    method: "GET",
    dataType: "json",
    responseType: "text",
    custom: {},
    timeout: 6e4,
    sslVerify: true,
    firstIpv4: false,
    validateStatus: function validateStatus(status) {
      return status >= 200 && status < 300;
    }
  };
  var clone = function() {
    function _instanceof(obj, type) {
      return type != null && obj instanceof type;
    }
    var nativeMap;
    try {
      nativeMap = Map;
    } catch (_) {
      nativeMap = function() {
      };
    }
    var nativeSet;
    try {
      nativeSet = Set;
    } catch (_) {
      nativeSet = function() {
      };
    }
    var nativePromise;
    try {
      nativePromise = Promise;
    } catch (_) {
      nativePromise = function() {
      };
    }
    function clone2(parent, circular, depth, prototype, includeNonEnumerable) {
      if (typeof circular === "object") {
        depth = circular.depth;
        prototype = circular.prototype;
        includeNonEnumerable = circular.includeNonEnumerable;
        circular = circular.circular;
      }
      var allParents = [];
      var allChildren = [];
      var useBuffer = typeof Buffer != "undefined";
      if (typeof circular == "undefined")
        circular = true;
      if (typeof depth == "undefined")
        depth = Infinity;
      function _clone(parent2, depth2) {
        if (parent2 === null)
          return null;
        if (depth2 === 0)
          return parent2;
        var child;
        var proto;
        if (typeof parent2 != "object") {
          return parent2;
        }
        if (_instanceof(parent2, nativeMap)) {
          child = new nativeMap();
        } else if (_instanceof(parent2, nativeSet)) {
          child = new nativeSet();
        } else if (_instanceof(parent2, nativePromise)) {
          child = new nativePromise(function(resolve, reject) {
            parent2.then(function(value) {
              resolve(_clone(value, depth2 - 1));
            }, function(err) {
              reject(_clone(err, depth2 - 1));
            });
          });
        } else if (clone2.__isArray(parent2)) {
          child = [];
        } else if (clone2.__isRegExp(parent2)) {
          child = new RegExp(parent2.source, __getRegExpFlags(parent2));
          if (parent2.lastIndex)
            child.lastIndex = parent2.lastIndex;
        } else if (clone2.__isDate(parent2)) {
          child = new Date(parent2.getTime());
        } else if (useBuffer && Buffer.isBuffer(parent2)) {
          if (Buffer.from) {
            child = Buffer.from(parent2);
          } else {
            child = new Buffer(parent2.length);
            parent2.copy(child);
          }
          return child;
        } else if (_instanceof(parent2, Error)) {
          child = Object.create(parent2);
        } else {
          if (typeof prototype == "undefined") {
            proto = Object.getPrototypeOf(parent2);
            child = Object.create(proto);
          } else {
            child = Object.create(prototype);
            proto = prototype;
          }
        }
        if (circular) {
          var index2 = allParents.indexOf(parent2);
          if (index2 != -1) {
            return allChildren[index2];
          }
          allParents.push(parent2);
          allChildren.push(child);
        }
        if (_instanceof(parent2, nativeMap)) {
          parent2.forEach(function(value, key) {
            var keyChild = _clone(key, depth2 - 1);
            var valueChild = _clone(value, depth2 - 1);
            child.set(keyChild, valueChild);
          });
        }
        if (_instanceof(parent2, nativeSet)) {
          parent2.forEach(function(value) {
            var entryChild = _clone(value, depth2 - 1);
            child.add(entryChild);
          });
        }
        for (var i in parent2) {
          var attrs = Object.getOwnPropertyDescriptor(parent2, i);
          if (attrs) {
            child[i] = _clone(parent2[i], depth2 - 1);
          }
          try {
            var objProperty = Object.getOwnPropertyDescriptor(parent2, i);
            if (objProperty.set === "undefined") {
              continue;
            }
            child[i] = _clone(parent2[i], depth2 - 1);
          } catch (e) {
            if (e instanceof TypeError) {
              continue;
            } else if (e instanceof ReferenceError) {
              continue;
            }
          }
        }
        if (Object.getOwnPropertySymbols) {
          var symbols = Object.getOwnPropertySymbols(parent2);
          for (var i = 0; i < symbols.length; i++) {
            var symbol = symbols[i];
            var descriptor = Object.getOwnPropertyDescriptor(parent2, symbol);
            if (descriptor && !descriptor.enumerable && !includeNonEnumerable) {
              continue;
            }
            child[symbol] = _clone(parent2[symbol], depth2 - 1);
            Object.defineProperty(child, symbol, descriptor);
          }
        }
        if (includeNonEnumerable) {
          var allPropertyNames = Object.getOwnPropertyNames(parent2);
          for (var i = 0; i < allPropertyNames.length; i++) {
            var propertyName = allPropertyNames[i];
            var descriptor = Object.getOwnPropertyDescriptor(parent2, propertyName);
            if (descriptor && descriptor.enumerable) {
              continue;
            }
            child[propertyName] = _clone(parent2[propertyName], depth2 - 1);
            Object.defineProperty(child, propertyName, descriptor);
          }
        }
        return child;
      }
      return _clone(parent, depth);
    }
    clone2.clonePrototype = function clonePrototype(parent) {
      if (parent === null)
        return null;
      var c = function() {
      };
      c.prototype = parent;
      return new c();
    };
    function __objToStr(o) {
      return Object.prototype.toString.call(o);
    }
    clone2.__objToStr = __objToStr;
    function __isDate(o) {
      return typeof o === "object" && __objToStr(o) === "[object Date]";
    }
    clone2.__isDate = __isDate;
    function __isArray(o) {
      return typeof o === "object" && __objToStr(o) === "[object Array]";
    }
    clone2.__isArray = __isArray;
    function __isRegExp(o) {
      return typeof o === "object" && __objToStr(o) === "[object RegExp]";
    }
    clone2.__isRegExp = __isRegExp;
    function __getRegExpFlags(re) {
      var flags = "";
      if (re.global)
        flags += "g";
      if (re.ignoreCase)
        flags += "i";
      if (re.multiline)
        flags += "m";
      return flags;
    }
    clone2.__getRegExpFlags = __getRegExpFlags;
    return clone2;
  }();
  class Request {
    /**
    * @param {Object} arg - 全局配置
    * @param {String} arg.baseURL - 全局根路径
    * @param {Object} arg.header - 全局header
    * @param {String} arg.method = [GET|POST|PUT|DELETE|CONNECT|HEAD|OPTIONS|TRACE] - 全局默认请求方式
    * @param {String} arg.dataType = [json] - 全局默认的dataType
    * @param {String} arg.responseType = [text|arraybuffer] - 全局默认的responseType。支付宝小程序不支持
    * @param {Object} arg.custom - 全局默认的自定义参数
    * @param {Number} arg.timeout - 全局默认的超时时间，单位 ms。默认60000。H5(HBuilderX 2.9.9+)、APP(HBuilderX 2.9.9+)、微信小程序（2.10.0）、支付宝小程序
    * @param {Boolean} arg.sslVerify - 全局默认的是否验证 ssl 证书。默认true.仅App安卓端支持（HBuilderX 2.3.3+）
    * @param {Boolean} arg.withCredentials - 全局默认的跨域请求时是否携带凭证（cookies）。默认false。仅H5支持（HBuilderX 2.6.15+）
    * @param {Boolean} arg.firstIpv4 - 全DNS解析时优先使用ipv4。默认false。仅 App-Android 支持 (HBuilderX 2.8.0+)
    * @param {Function(statusCode):Boolean} arg.validateStatus - 全局默认的自定义验证器。默认statusCode >= 200 && statusCode < 300
    */
    constructor(arg = {}) {
      if (!isPlainObject$1(arg)) {
        arg = {};
        console.warn("设置全局参数必须接收一个Object");
      }
      this.config = clone({ ...defaults, ...arg });
      this.interceptors = {
        request: new InterceptorManager(),
        response: new InterceptorManager()
      };
    }
    /**
    * @Function
    * @param {Request~setConfigCallback} f - 设置全局默认配置
    */
    setConfig(f) {
      this.config = f(this.config);
    }
    middleware(config2) {
      config2 = mergeConfig(this.config, config2);
      const chain = [dispatchRequest, void 0];
      let promise2 = Promise.resolve(config2);
      this.interceptors.request.forEach((interceptor) => {
        chain.unshift(interceptor.fulfilled, interceptor.rejected);
      });
      this.interceptors.response.forEach((interceptor) => {
        chain.push(interceptor.fulfilled, interceptor.rejected);
      });
      while (chain.length) {
        promise2 = promise2.then(chain.shift(), chain.shift());
      }
      return promise2;
    }
    /**
    * @Function
    * @param {Object} config - 请求配置项
    * @prop {String} options.url - 请求路径
    * @prop {Object} options.data - 请求参数
    * @prop {Object} [options.responseType = config.responseType] [text|arraybuffer] - 响应的数据类型
    * @prop {Object} [options.dataType = config.dataType] - 如果设为 json，会尝试对返回的数据做一次 JSON.parse
    * @prop {Object} [options.header = config.header] - 请求header
    * @prop {Object} [options.method = config.method] - 请求方法
    * @returns {Promise<unknown>}
    */
    request(config2 = {}) {
      return this.middleware(config2);
    }
    get(url2, options = {}) {
      return this.middleware({
        url: url2,
        method: "GET",
        ...options
      });
    }
    post(url2, data, options = {}) {
      return this.middleware({
        url: url2,
        data,
        method: "POST",
        ...options
      });
    }
    put(url2, data, options = {}) {
      return this.middleware({
        url: url2,
        data,
        method: "PUT",
        ...options
      });
    }
    delete(url2, data, options = {}) {
      return this.middleware({
        url: url2,
        data,
        method: "DELETE",
        ...options
      });
    }
    options(url2, data, options = {}) {
      return this.middleware({
        url: url2,
        data,
        method: "OPTIONS",
        ...options
      });
    }
    upload(url2, config2 = {}) {
      config2.url = url2;
      config2.method = "UPLOAD";
      return this.middleware(config2);
    }
    download(url2, config2 = {}) {
      config2.url = url2;
      config2.method = "DOWNLOAD";
      return this.middleware(config2);
    }
  }
  const http$1 = new Request();
  function email(value) {
    return /^\w+((-\w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z0-9]+$/.test(value);
  }
  function mobile(value) {
    return /^1[23456789]\d{9}$/.test(value);
  }
  function url(value) {
    return /^((https|http|ftp|rtsp|mms):\/\/)(([0-9a-zA-Z_!~*'().&=+$%-]+: )?[0-9a-zA-Z_!~*'().&=+$%-]+@)?(([0-9]{1,3}.){3}[0-9]{1,3}|([0-9a-zA-Z_!~*'()-]+.)*([0-9a-zA-Z][0-9a-zA-Z-]{0,61})?[0-9a-zA-Z].[a-zA-Z]{2,6})(:[0-9]{1,4})?((\/?)|(\/[0-9a-zA-Z_!~*'().;?:@&=+$,%#-]+)+\/?)$/.test(value);
  }
  function date(value) {
    if (!value)
      return false;
    if (typeof value === "number") {
      if (value.toString().length !== 10 && value.toString().length !== 13) {
        return false;
      }
      return !isNaN(new Date(value).getTime());
    }
    if (typeof value === "string") {
      const numV = Number(value);
      if (!isNaN(numV)) {
        if (numV.toString().length === 10 || numV.toString().length === 13) {
          return !isNaN(new Date(numV).getTime());
        }
      }
      if (value.length < 10 || value.length > 19) {
        return false;
      }
      const dateRegex = /^\d{4}[-\/]\d{2}[-\/]\d{2}( \d{1,2}:\d{2}(:\d{2})?)?$/;
      if (!dateRegex.test(value)) {
        return false;
      }
      const dateValue = new Date(value);
      return !isNaN(dateValue.getTime());
    }
    return false;
  }
  function dateISO(value) {
    return /^\d{4}[\/\-](0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])$/.test(value);
  }
  function number(value) {
    return /^[\+-]?(\d+\.?\d*|\.\d+|\d\.\d+e\+\d+)$/.test(value);
  }
  function string(value) {
    return typeof value === "string";
  }
  function digits(value) {
    return /^\d+$/.test(value);
  }
  function idCard(value) {
    return /^[1-9]\d{5}[1-9]\d{3}((0\d)|(1[0-2]))(([0|1|2]\d)|3[0-1])\d{3}([0-9]|X)$/.test(
      value
    );
  }
  function carNo(value) {
    if (!value)
      return false;
    const xreg = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z]{1}[A-Z]{1}(([0-9]{5}[DF]$)|([DF][A-HJ-NP-Z0-9][0-9]{4}$))/;
    const creg = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z]{1}[A-Z]{1}[A-HJ-NP-Z0-9]{4}[A-HJ-NP-Z0-9挂学警港澳]{1}$/;
    if (value.length === 7) {
      return creg.test(value);
    }
    if (value.length === 8) {
      return xreg.test(value);
    }
    return false;
  }
  function amount(value) {
    return /^[1-9]\d*(,\d{3})*(\.\d{1,2})?$|^0\.\d{1,2}$/.test(value);
  }
  function chinese(value) {
    const reg = /^[\u4e00-\u9fa5]+$/gi;
    return reg.test(value);
  }
  function letter(value) {
    return /^[a-zA-Z]*$/.test(value);
  }
  function enOrNum(value) {
    const reg = /^[0-9a-zA-Z]*$/g;
    return reg.test(value);
  }
  function contains(value, param) {
    return value.indexOf(param) >= 0;
  }
  function range$1(value, param) {
    return value >= param[0] && value <= param[1];
  }
  function rangeLength(value, param) {
    return value.length >= param[0] && value.length <= param[1];
  }
  function landline(value) {
    const reg = /^\d{3,4}-\d{7,8}(-\d{3,4})?$/;
    return reg.test(value);
  }
  function empty(value) {
    switch (typeof value) {
      case "undefined":
        return true;
      case "string":
        if (value.replace(/(^[ \t\n\r]*)|([ \t\n\r]*$)/g, "").length == 0)
          return true;
        break;
      case "boolean":
        if (!value)
          return true;
        break;
      case "number":
        if (value === 0 || isNaN(value))
          return true;
        break;
      case "object":
        if (value === null || value.length === 0)
          return true;
        for (const i in value) {
          return false;
        }
        return true;
    }
    return false;
  }
  function jsonString(value) {
    if (typeof value === "string") {
      try {
        const obj = JSON.parse(value);
        if (typeof obj === "object" && obj) {
          return true;
        }
        return false;
      } catch (e) {
        return false;
      }
    }
    return false;
  }
  function array(value) {
    if (typeof Array.isArray === "function") {
      return Array.isArray(value);
    }
    return Object.prototype.toString.call(value) === "[object Array]";
  }
  function object(value) {
    return Object.prototype.toString.call(value) === "[object Object]";
  }
  function objectPromise(value) {
    return Object.prototype.toString.call(value) === "[object Promise]";
  }
  function code(value, len = 6) {
    return new RegExp(`^\\d{${len}}$`).test(value);
  }
  function func(value) {
    return typeof value === "function";
  }
  function promise(value) {
    return objectPromise(value) && func(value.then) && func(value.catch);
  }
  function image(value) {
    const newValue = value.split("?")[0];
    const IMAGE_REGEXP = /\.(jpeg|jpg|gif|png|svg|webp|jfif|bmp|dpg)/i;
    return IMAGE_REGEXP.test(newValue);
  }
  function video(value) {
    const VIDEO_REGEXP = /\.(mp4|mpg|mpeg|dat|asf|avi|rm|rmvb|mov|wmv|flv|mkv|m3u8)/i;
    return VIDEO_REGEXP.test(value);
  }
  function regExp(o) {
    return o && Object.prototype.toString.call(o) === "[object RegExp]";
  }
  const test = {
    email,
    mobile,
    url,
    date,
    dateISO,
    number,
    digits,
    idCard,
    carNo,
    amount,
    chinese,
    letter,
    enOrNum,
    contains,
    range: range$1,
    rangeLength,
    empty,
    isEmpty: empty,
    jsonString,
    landline,
    object,
    array,
    code,
    func,
    promise,
    video,
    image,
    regExp,
    string
  };
  function strip(num, precision = 15) {
    return +parseFloat(Number(num).toPrecision(precision));
  }
  function digitLength(num) {
    const eSplit = num.toString().split(/[eE]/);
    const len = (eSplit[0].split(".")[1] || "").length - +(eSplit[1] || 0);
    return len > 0 ? len : 0;
  }
  function float2Fixed(num) {
    if (num.toString().indexOf("e") === -1) {
      return Number(num.toString().replace(".", ""));
    }
    const dLen = digitLength(num);
    return dLen > 0 ? strip(Number(num) * Math.pow(10, dLen)) : Number(num);
  }
  function checkBoundary(num) {
    {
      if (num > Number.MAX_SAFE_INTEGER || num < Number.MIN_SAFE_INTEGER) {
        console.warn(`${num} 超出了精度限制，结果可能不正确`);
      }
    }
  }
  function iteratorOperation(arr, operation) {
    const [num1, num2, ...others] = arr;
    let res = operation(num1, num2);
    others.forEach((num) => {
      res = operation(res, num);
    });
    return res;
  }
  function times(...nums) {
    if (nums.length > 2) {
      return iteratorOperation(nums, times);
    }
    const [num1, num2] = nums;
    const num1Changed = float2Fixed(num1);
    const num2Changed = float2Fixed(num2);
    const baseNum = digitLength(num1) + digitLength(num2);
    const leftValue = num1Changed * num2Changed;
    checkBoundary(leftValue);
    return leftValue / Math.pow(10, baseNum);
  }
  function divide(...nums) {
    if (nums.length > 2) {
      return iteratorOperation(nums, divide);
    }
    const [num1, num2] = nums;
    const num1Changed = float2Fixed(num1);
    const num2Changed = float2Fixed(num2);
    checkBoundary(num1Changed);
    checkBoundary(num2Changed);
    return times(num1Changed / num2Changed, strip(Math.pow(10, digitLength(num2) - digitLength(num1))));
  }
  function round(num, ratio) {
    const base = Math.pow(10, ratio);
    let result = divide(Math.round(Math.abs(times(num, base))), base);
    if (num < 0 && result !== 0) {
      result = times(result, -1);
    }
    return result;
  }
  function emptyNodeInfo() {
    return {
      width: 0,
      height: 0,
      left: 0,
      right: 0,
      top: 0,
      bottom: 0
    };
  }
  function isCompUnmounted(comp) {
    if (!comp) {
      return false;
    }
    if (comp.__upUnmounted) {
      return true;
    }
    return !!(comp.$ ? comp.$.isUnmounted : comp.isUnmounted);
  }
  function upGetRect(selector, all = false, comp = null) {
    if (isCompUnmounted(comp)) {
      return Promise.resolve(all ? [] : emptyNodeInfo());
    }
    return new Promise((resolve) => {
      const query = uni.createSelectorQuery();
      const scopedQuery = comp ? query.in(comp) : query;
      scopedQuery[all ? "selectAll" : "select"](selector).boundingClientRect((rect) => {
        if (all) {
          resolve(Array.isArray(rect) ? rect : []);
          return;
        }
        resolve(rect || emptyNodeInfo());
      }).exec();
    });
  }
  function noopIntersectionObserver() {
    const observer = {
      relativeTo: () => observer,
      relativeToViewport: () => observer,
      observe: () => {
      },
      disconnect: () => {
      }
    };
    return observer;
  }
  function upCreateIntersectionObserver(comp, options) {
    if (isCompUnmounted(comp)) {
      return noopIntersectionObserver();
    }
    if (comp && typeof comp.createIntersectionObserver === "function") {
      return options ? comp.createIntersectionObserver(options) : comp.createIntersectionObserver();
    }
    return options ? uni.createIntersectionObserver(comp, options) : uni.createIntersectionObserver(comp);
  }
  function range(min = 0, max = 0, value = 0) {
    return Math.max(min, Math.min(max, Number(value)));
  }
  function getPx(value, unit = false) {
    if (number(value)) {
      return unit ? `${value}px` : Number(value);
    }
    if (/(rpx|upx)$/.test(value)) {
      return unit ? `${uni.upx2px(parseInt(value))}px` : Number(uni.upx2px(parseInt(value)));
    }
    return unit ? `${parseInt(value)}px` : parseInt(value);
  }
  function rpx2px(value) {
    return uni.upx2px(value);
  }
  function sleep(value = 30) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, value);
    });
  }
  function os() {
    return uni.getDeviceInfo().platform.toLowerCase();
  }
  function sys() {
    return uni.getSystemInfoSync();
  }
  function getWindowInfo() {
    let ret = {};
    ret = uni.getWindowInfo();
    return ret;
  }
  function random(min, max) {
    if (min >= 0 && max > 0 && max >= min) {
      const gab = max - min + 1;
      return Math.floor(Math.random() * gab + min);
    }
    return 0;
  }
  function guid(len = 32, firstU = true, radix = null) {
    const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split("");
    const uuid = [];
    radix = radix || chars.length;
    if (len) {
      for (let i = 0; i < len; i++)
        uuid[i] = chars[0 | Math.random() * radix];
    } else {
      let r;
      uuid[8] = uuid[13] = uuid[18] = uuid[23] = "-";
      uuid[14] = "4";
      for (let i = 0; i < 36; i++) {
        if (!uuid[i]) {
          r = 0 | Math.random() * 16;
          uuid[i] = chars[i == 19 ? r & 3 | 8 : r];
        }
      }
    }
    if (firstU) {
      uuid.shift();
      return `u${uuid.join("")}`;
    }
    return uuid.join("");
  }
  function $parent(name = void 0) {
    let parent = this.$parent;
    while (parent) {
      let name2 = "";
      if (name.startsWith("up-")) {
        name2 = name.replace(/up-([a-zA-Z0-9-_]+)/g, "u-$1");
      } else if (name.startsWith("u-")) {
        name2 = name.replace(/u-([a-zA-Z0-9-_]+)/g, "up-$1");
      }
      if (parent.$options && parent.$options.name !== name && parent.$options.name !== name2) {
        parent = parent.$parent;
      } else {
        return parent;
      }
    }
    return false;
  }
  function addStyle(customStyle, target = "object") {
    if (empty(customStyle) || typeof customStyle === "object" && target === "object" || target === "string" && typeof customStyle === "string") {
      return customStyle;
    }
    if (target === "object") {
      customStyle = trim(customStyle);
      const styleArray = customStyle.split(";");
      const style = {};
      for (let i = 0; i < styleArray.length; i++) {
        if (styleArray[i]) {
          const item = styleArray[i].split(":");
          style[trim(item[0])] = trim(item[1]);
        }
      }
      return style;
    }
    let string2 = "";
    if (typeof customStyle === "object") {
      customStyle.forEach((val, i) => {
        const key = i.replace(/([A-Z])/g, "-$1").toLowerCase();
        string2 += `${key}:${val};`;
      });
    }
    return trim(string2);
  }
  function addUnit(value = "auto", unit = "") {
    if (!unit) {
      unit = config.unit || "px";
    }
    if (unit == "rpx" && number(String(value))) {
      value = value * 2;
    }
    value = String(value);
    return number(value) ? `${value}${unit}` : value;
  }
  function deepClone(obj) {
    if ([null, void 0, NaN, false].includes(obj))
      return obj;
    if (typeof obj !== "object" && typeof obj !== "function") {
      return obj;
    }
    const o = array(obj) ? [] : {};
    for (const i in obj) {
      if (obj.hasOwnProperty(i)) {
        o[i] = typeof obj[i] === "object" ? deepClone(obj[i]) : obj[i];
      }
    }
    return o;
  }
  function deepMerge(targetOrigin = {}, source = {}) {
    let target = deepClone(targetOrigin);
    if (typeof target !== "object" || typeof source !== "object")
      return false;
    for (const prop in source) {
      if (!source.hasOwnProperty(prop))
        continue;
      if (prop in target) {
        if (source[prop] == null) {
          target[prop] = source[prop];
        } else if (typeof target[prop] !== "object") {
          target[prop] = source[prop];
        } else if (typeof source[prop] !== "object") {
          target[prop] = source[prop];
        } else if (target[prop].concat && source[prop].concat) {
          target[prop] = target[prop].concat(source[prop]);
        } else {
          target[prop] = deepMerge(target[prop], source[prop]);
        }
      } else {
        target[prop] = source[prop];
      }
    }
    return target;
  }
  function shallowMerge(target, source = {}) {
    if (typeof target !== "object" || typeof source !== "object")
      return false;
    for (const prop in source) {
      if (!source.hasOwnProperty(prop))
        continue;
      if (prop in target) {
        if (source[prop] == null) {
          target[prop] = source[prop];
        } else if (typeof target[prop] !== "object") {
          target[prop] = source[prop];
        } else if (typeof source[prop] !== "object") {
          target[prop] = source[prop];
        } else if (target[prop].concat && source[prop].concat) {
          target[prop] = target[prop].concat(source[prop]);
        } else {
          target[prop] = shallowMerge(target[prop], source[prop]);
        }
      } else {
        target[prop] = source[prop];
      }
    }
    return target;
  }
  function error(err) {
    {
      console.error(`uView提示：${err}`);
    }
  }
  function randomArray(array2 = []) {
    return array2.sort(() => Math.random() - 0.5);
  }
  if (!String.prototype.padStart) {
    String.prototype.padStart = function(maxLength, fillString = " ") {
      if (Object.prototype.toString.call(fillString) !== "[object String]") {
        throw new TypeError(
          "fillString must be String"
        );
      }
      const str = this;
      if (str.length >= maxLength)
        return String(str);
      const fillLength = maxLength - str.length;
      let times2 = Math.ceil(fillLength / fillString.length);
      while (times2 >>= 1) {
        fillString += fillString;
        if (times2 === 1) {
          fillString += fillString;
        }
      }
      return fillString.slice(0, fillLength) + str;
    };
  }
  function timeFormat(dateTime = null, formatStr = "yyyy-mm-dd") {
    let date2;
    if (!dateTime) {
      date2 = /* @__PURE__ */ new Date();
    } else if (/^\d{10}$/.test(dateTime.toString().trim())) {
      date2 = new Date(dateTime * 1e3);
    } else if (typeof dateTime === "string" && /^\d+$/.test(dateTime.trim())) {
      date2 = new Date(Number(dateTime));
    } else if (typeof dateTime === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})?$/.test(dateTime)) {
      date2 = new Date(dateTime);
    } else {
      date2 = new Date(
        typeof dateTime === "string" ? dateTime.replace(/-/g, "/") : dateTime
      );
    }
    const timeSource = {
      "y": date2.getFullYear().toString(),
      // 年
      "m": (date2.getMonth() + 1).toString().padStart(2, "0"),
      // 月
      "d": date2.getDate().toString().padStart(2, "0"),
      // 日
      "h": date2.getHours().toString().padStart(2, "0"),
      // 时
      "M": date2.getMinutes().toString().padStart(2, "0"),
      // 分
      "s": date2.getSeconds().toString().padStart(2, "0")
      // 秒
      // 有其他格式化字符需求可以继续添加，必须转化成字符串
    };
    for (const key in timeSource) {
      const [ret] = new RegExp(`${key}+`).exec(formatStr) || [];
      if (ret) {
        const beginIndex = key === "y" && ret.length === 2 ? 2 : 0;
        formatStr = formatStr.replace(ret, timeSource[key].slice(beginIndex));
      }
    }
    return formatStr;
  }
  function timeFrom(timestamp = null, format = "yyyy-mm-dd") {
    if (timestamp == null)
      timestamp = Number(/* @__PURE__ */ new Date());
    timestamp = parseInt(timestamp);
    if (timestamp.toString().length == 10)
      timestamp *= 1e3;
    let timer = (/* @__PURE__ */ new Date()).getTime() - timestamp;
    timer = parseInt(timer / 1e3);
    let tips = "";
    switch (true) {
      case timer < 300:
        tips = "刚刚";
        break;
      case (timer >= 300 && timer < 3600):
        tips = `${parseInt(timer / 60)}分钟前`;
        break;
      case (timer >= 3600 && timer < 86400):
        tips = `${parseInt(timer / 3600)}小时前`;
        break;
      case (timer >= 86400 && timer < 2592e3):
        tips = `${parseInt(timer / 86400)}天前`;
        break;
      default:
        if (format === false) {
          if (timer >= 2592e3 && timer < 365 * 86400) {
            tips = `${parseInt(timer / (86400 * 30))}个月前`;
          } else {
            tips = `${parseInt(timer / (86400 * 365))}年前`;
          }
        } else {
          tips = timeFormat(timestamp, format);
        }
    }
    return tips;
  }
  function trim(str, pos = "both") {
    str = String(str);
    if (pos == "both") {
      return str.replace(/^\s+|\s+$/g, "");
    }
    if (pos == "left") {
      return str.replace(/^\s*/, "");
    }
    if (pos == "right") {
      return str.replace(/(\s*$)/g, "");
    }
    if (pos == "all") {
      return str.replace(/\s+/g, "");
    }
    return str;
  }
  function queryParams(data = {}, isPrefix = true, arrayFormat = "brackets") {
    const prefix = isPrefix ? "?" : "";
    const _result = [];
    if (["indices", "brackets", "repeat", "comma"].indexOf(arrayFormat) == -1)
      arrayFormat = "brackets";
    for (const key in data) {
      const value = data[key];
      if (["", void 0, null].indexOf(value) >= 0) {
        continue;
      }
      if (value.constructor === Array) {
        switch (arrayFormat) {
          case "indices":
            for (let i = 0; i < value.length; i++) {
              _result.push(`${key}[${i}]=${value[i]}`);
            }
            break;
          case "brackets":
            value.forEach((_value) => {
              _result.push(`${key}[]=${_value}`);
            });
            break;
          case "repeat":
            value.forEach((_value) => {
              _result.push(`${key}=${_value}`);
            });
            break;
          case "comma":
            let commaStr = "";
            value.forEach((_value) => {
              commaStr += (commaStr ? "," : "") + _value;
            });
            _result.push(`${key}=${commaStr}`);
            break;
          default:
            value.forEach((_value) => {
              _result.push(`${key}[]=${_value}`);
            });
        }
      } else {
        _result.push(`${key}=${value}`);
      }
    }
    return _result.length ? prefix + _result.join("&") : "";
  }
  function toast$1(title, duration = 2e3) {
    uni.showToast({
      title: String(title),
      icon: "none",
      duration
    });
  }
  function type2icon(type = "success", fill = false) {
    if (["primary", "info", "error", "warning", "success"].indexOf(type) == -1)
      type = "success";
    let iconName = "";
    switch (type) {
      case "primary":
        iconName = "info-circle";
        break;
      case "info":
        iconName = "info-circle";
        break;
      case "error":
        iconName = "close-circle";
        break;
      case "warning":
        iconName = "error-circle";
        break;
      case "success":
        iconName = "checkmark-circle";
        break;
      default:
        iconName = "checkmark-circle";
    }
    if (fill)
      iconName += "-fill";
    return iconName;
  }
  function priceFormat(number2, decimals = 0, decimalPoint = ".", thousandsSeparator = ",") {
    number2 = `${number2}`.replace(/[^0-9+-Ee.]/g, "");
    const n = !isFinite(+number2) ? 0 : +number2;
    const prec = !isFinite(+decimals) ? 0 : Math.abs(decimals);
    const sep = typeof thousandsSeparator === "undefined" ? "," : thousandsSeparator;
    const dec = typeof decimalPoint === "undefined" ? "." : decimalPoint;
    let s = "";
    s = (prec ? round(n, prec) + "" : `${Math.round(n)}`).split(".");
    const re = /(-?\d+)(\d{3})/;
    while (re.test(s[0])) {
      s[0] = s[0].replace(re, `$1${sep}$2`);
    }
    if ((s[1] || "").length < prec) {
      s[1] = s[1] || "";
      s[1] += new Array(prec - s[1].length + 1).join("0");
    }
    return s.join(dec);
  }
  function getDuration(value, unit = true) {
    const valueNum = parseInt(value);
    if (unit) {
      if (/s$/.test(value))
        return value;
      return value > 30 ? `${value}ms` : `${value}s`;
    }
    if (/ms$/.test(value))
      return valueNum;
    if (/s$/.test(value))
      return valueNum > 30 ? valueNum : valueNum * 1e3;
    return valueNum;
  }
  function padZero(value) {
    return `00${value}`.slice(-2);
  }
  function formValidate(instance, event) {
    const formItem = $parent.call(instance, "up-form-item");
    const form = $parent.call(instance, "up-form");
    if (formItem && form) {
      form.validateField(formItem.prop, () => {
      }, event);
    }
  }
  function getProperty(obj, key) {
    if (typeof obj !== "object" || null == obj) {
      return "";
    }
    if (typeof key !== "string" || key === "") {
      return "";
    }
    if (key.indexOf(".") !== -1) {
      const keys = key.split(".");
      let firstObj = obj[keys[0]] || {};
      for (let i = 1; i < keys.length; i++) {
        if (firstObj) {
          firstObj = firstObj[keys[i]];
        }
      }
      return firstObj;
    }
    return obj[key];
  }
  function setProperty(obj, key, value) {
    if (typeof obj !== "object" || null == obj) {
      return;
    }
    const inFn = function(_obj, keys, v) {
      if (keys.length === 1) {
        _obj[keys[0]] = v;
        return;
      }
      while (keys.length > 1) {
        const k = keys[0];
        if (!_obj[k] || typeof _obj[k] !== "object") {
          _obj[k] = {};
        }
        keys.shift();
        inFn(_obj[k], keys, v);
      }
    };
    if (typeof key !== "string" || key === "")
      ;
    else if (key.indexOf(".") !== -1) {
      const keys = key.split(".");
      inFn(obj, keys, value);
    } else {
      obj[key] = value;
    }
  }
  function page() {
    const pages2 = getCurrentPages();
    return `/${pages2[pages2.length - 1].route || ""}`;
  }
  function pages() {
    const pages2 = getCurrentPages();
    return pages2;
  }
  function getValueByPath(obj, path) {
    const pathArr = path.split(".");
    return pathArr.reduce((acc, curr) => {
      return acc && acc[curr] !== void 0 ? acc[curr] : void 0;
    }, obj);
  }
  function genLightColor(textColor, lightness = 95) {
    const rgb = parseColorWithoutDOM(textColor);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const bgHsl = {
      h: hsl.h,
      s: hsl.s,
      l: Math.min(lightness, 95)
    };
    return hslToHex(bgHsl.h, bgHsl.s, bgHsl.l);
  }
  function parseColorWithoutDOM(colorStr) {
    const str = colorStr.toLowerCase().trim();
    if (str.startsWith("#")) {
      const hex = str.replace("#", "");
      const fullHex = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
      return {
        r: parseInt(fullHex.substring(0, 2), 16),
        g: parseInt(fullHex.substring(2, 4), 16),
        b: parseInt(fullHex.substring(4, 6), 16)
      };
    }
    const rgbMatch = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgbMatch) {
      return {
        r: +rgbMatch[1],
        g: +rgbMatch[2],
        b: +rgbMatch[3]
      };
    }
    throw new Error("Invalid color format");
  }
  function rgbToHsl(r, g, b) {
    r /= 255, g /= 255, b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h = (h * 60).toFixed(1);
    }
    return { h: +h, s: +(s * 100).toFixed(1), l: +(l * 100).toFixed(1) };
  }
  function hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n) => {
      const k = (n + h / 30) % 12;
      const color2 = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color2).toString(16).padStart(2, "0");
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }
  const index = {
    upGetRect,
    upCreateIntersectionObserver,
    range,
    getPx,
    sleep,
    os,
    sys,
    getWindowInfo,
    random,
    guid,
    $parent,
    addStyle,
    addUnit,
    deepClone,
    deepMerge,
    shallowMerge,
    error,
    randomArray,
    timeFormat,
    timeFrom,
    trim,
    queryParams,
    toast: toast$1,
    type2icon,
    priceFormat,
    getDuration,
    padZero,
    formValidate,
    getProperty,
    setProperty,
    page,
    pages,
    getValueByPath,
    genLightColor,
    rpx2px
  };
  const componentKeys = [
    "actionSheet",
    "album",
    "alert",
    "avatar",
    "avatarGroup",
    "backtop",
    "badge",
    "box",
    "button",
    "calendar",
    "calendarStrip",
    "carKeyboard",
    "card",
    "cell",
    "cellGroup",
    "checkbox",
    "checkboxGroup",
    "circleProgress",
    "code",
    "codeInput",
    "col",
    "collapse",
    "collapseItem",
    "columnNotice",
    "countDown",
    "countTo",
    "datetimePicker",
    "divider",
    "dropdown",
    "dropdownItem",
    "empty",
    "flex",
    "form",
    "formItem",
    "gap",
    "grid",
    "gridItem",
    "guide",
    "icon",
    "image",
    "indexAnchor",
    "indexItem",
    "indexList",
    "input",
    "keyboard",
    "line",
    "lineProgress",
    "link",
    "list",
    "listItem",
    "loadingIcon",
    "loadingPage",
    "loadmore",
    "modal",
    "navbar",
    "navbarMini",
    "noNetwork",
    "noticeBar",
    "notify",
    "novelReader",
    "numberBox",
    "numberKeyboard",
    "overlay",
    "parse",
    "pdfReader",
    "picker",
    "pickerColumn",
    "popover",
    "popup",
    "radio",
    "radioGroup",
    "rate",
    "readMore",
    "row",
    "rowNotice",
    "safeBottom",
    "scrollList",
    "search",
    "section",
    "skeleton",
    "slider",
    "statusBar",
    "steps",
    "stepsItem",
    "sticky",
    "subsection",
    "swipeAction",
    "swipeActionItem",
    "swiper",
    "swiperIndicator",
    "switch",
    "tabbar",
    "tabbarItem",
    "table",
    "tabs",
    "tabsItem",
    "tag",
    "td",
    "text",
    "textarea",
    "th",
    "toast",
    "toolbar",
    "tooltip",
    "tr",
    "transition",
    "upload",
    "video"
  ];
  const props$7 = {};
  function ensureComponentProps(key) {
    if (!props$7[key] || typeof props$7[key] !== "object") {
      props$7[key] = {};
    }
    return props$7[key];
  }
  function isPlainObject(value) {
    return Object.prototype.toString.call(value) === "[object Object]";
  }
  function cloneDefaultValue(value) {
    if (Array.isArray(value)) {
      return value.slice();
    }
    if (isPlainObject(value)) {
      return mergeDefaults({}, value);
    }
    return value;
  }
  function mergeDefaults(target, defaults2 = {}) {
    if (!target || typeof target !== "object" || !defaults2 || typeof defaults2 !== "object") {
      return target;
    }
    Object.keys(defaults2).forEach((key) => {
      const defaultValue = defaults2[key];
      const targetValue = target[key];
      if (targetValue === void 0) {
        target[key] = cloneDefaultValue(defaultValue);
      } else if (isPlainObject(targetValue) && isPlainObject(defaultValue)) {
        mergeDefaults(targetValue, defaultValue);
      }
    });
    return target;
  }
  componentKeys.forEach(ensureComponentProps);
  function registerComponentProps(defaultProps = {}) {
    Object.keys(defaultProps || {}).forEach((key) => {
      const componentProps = ensureComponentProps(key);
      mergeDefaults(componentProps, defaultProps[key]);
    });
    return props$7;
  }
  function setPropsConfig(configProps = {}) {
    Object.keys(configProps || {}).forEach((key) => {
      shallowMerge(ensureComponentProps(key), configProps[key]);
    });
    return props$7;
  }
  function setConfig$1(configs = {}) {
    shallowMerge(config, configs.config || {});
    setPropsConfig(configs.props || {});
    shallowMerge(color$2, configs.color || {});
    shallowMerge(zIndex, configs.zIndex || {});
  }
  if (typeof uni !== "undefined" && uni && uni.upuiParams) {
    console.log("setting uview-plus");
    let temp = uni.upuiParams();
    if (temp.httpIns) {
      temp.httpIns(http$1);
    }
    if (temp.options) {
      setConfig$1(temp.options);
    }
  }
  const defProps$5 = registerComponentProps(TransitionDefaultProps);
  const props$6 = defineMixin({
    props: {
      // 是否展示组件
      show: {
        type: Boolean,
        default: () => defProps$5.transition.show
      },
      // 使用的动画模式
      mode: {
        type: String,
        default: () => defProps$5.transition.mode
      },
      // 动画的执行时间，单位ms
      duration: {
        type: [String, Number],
        default: () => defProps$5.transition.duration
      },
      // 使用的动画过渡函数
      timingFunction: {
        type: String,
        default: () => defProps$5.transition.timingFunction
      }
    }
  });
  const mpMixin = defineMixin({});
  class Router {
    constructor() {
      this.config = {
        type: "navigateTo",
        url: "",
        delta: 1,
        // navigateBack页面后退时,回退的层数
        params: {},
        // 传递的参数
        animationType: "pop-in",
        // 窗口动画,只在APP有效
        animationDuration: 300,
        // 窗口动画持续时间,单位毫秒,只在APP有效
        intercept: false
        // 是否需要拦截
      };
      this.route = this.route.bind(this);
    }
    // 判断url前面是否有"/"，如果没有则加上，否则无法跳转
    addRootPath(url2) {
      return url2[0] === "/" ? url2 : `/${url2}`;
    }
    // 整合路由参数
    mixinParam(url2, params2) {
      url2 = url2 && this.addRootPath(url2);
      let query = "";
      if (/.*\/.*\?.*=.*/.test(url2)) {
        query = queryParams(params2, false);
        return url2 += `&${query}`;
      }
      query = queryParams(params2);
      return url2 += query;
    }
    // 对外的方法名称
    async route(options = {}, params2 = {}) {
      let mergeConfig2 = {};
      if (typeof options === "string") {
        mergeConfig2.url = this.mixinParam(options, params2);
        mergeConfig2.type = "navigateTo";
      } else {
        mergeConfig2 = deepMerge(this.config, options);
        mergeConfig2.url = this.mixinParam(options.url, options.params);
      }
      if (mergeConfig2.url === page())
        return;
      if (params2.intercept) {
        this.config.intercept = params2.intercept;
      }
      mergeConfig2.params = params2;
      mergeConfig2 = deepMerge(this.config, mergeConfig2);
      if (typeof uni.$u.routeIntercept === "function") {
        const isNext = await new Promise((resolve, reject) => {
          uni.$u.routeIntercept(mergeConfig2, resolve);
        });
        isNext && this.openPage(mergeConfig2);
      } else {
        this.openPage(mergeConfig2);
      }
    }
    // 执行路由跳转
    openPage(config2) {
      const {
        url: url2,
        type,
        delta,
        animationType,
        animationDuration
      } = config2;
      if (config2.type == "navigateTo" || config2.type == "to") {
        uni.navigateTo({
          url: url2,
          animationType,
          animationDuration
        });
      }
      if (config2.type == "redirectTo" || config2.type == "redirect") {
        uni.redirectTo({
          url: url2
        });
      }
      if (config2.type == "switchTab" || config2.type == "tab") {
        uni.switchTab({
          url: url2
        });
      }
      if (config2.type == "reLaunch" || config2.type == "launch") {
        uni.reLaunch({
          url: url2
        });
      }
      if (config2.type == "navigateBack" || config2.type == "back") {
        uni.navigateBack({
          delta
        });
      }
    }
  }
  const route = new Router().route;
  const THEME_MODE_STORAGE_KEY$1 = "u-theme-mode";
  const FALLBACK_THEME_VARS = {
    light: {
      "--up-main-color": "var(--up-light-main-color, #303133)",
      "--up-content-color": "var(--up-light-content-color, #606266)",
      "--up-tips-color": "var(--up-light-tips-color, #909193)",
      "--up-light-color": "var(--up-light-light-color, #c0c4cc)",
      "--up-border-color": "var(--up-light-border-color, #dadbde)",
      "--up-bg-color": "var(--up-light-bg-color, #f3f4f6)",
      "--up-hover-bg-color": "#e7ebf0",
      "--up-page-bg-color": "#f3f4f6",
      "--up-card-bg-color": "#ffffff",
      "--up-navbar-bg-color": "#ffffff",
      "--up-navbar-glass-bg-color": "rgba(255, 255, 255, 0.82)",
      "--up-navbar-glass-blur": "20px",
      "--up-table2-header-bg-color": "#f5f7fa",
      "--up-table2-zebra-bg-color": "#fafafa",
      "--up-table2-highlight-bg-color": "#f5f7fa",
      "--up-gap-bg-color": "#f3f4f6",
      "--up-skeleton-bg-color": "#f1f2f4",
      "--up-skeleton-shimmer-color": "#e6e6e6",
      "--up-swipe-action-button-bg-color": "#c7c6cd",
      "--up-index-list-indicator-bg-color": "#c9c9c9",
      "--up-calendar-month-mark-color": "rgba(231, 232, 234, 0.83)",
      "--up-disabled-color": "var(--up-light-disabled-color, #c8c9cc)",
      "--up-primary": "var(--up-light-primary, #3c9cff)",
      "--up-primary-dark": "var(--up-light-primary-dark, #398ade)",
      "--up-primary-disabled": "var(--up-light-primary-disabled, #9acafc)",
      "--up-primary-light": "var(--up-light-primary-light, #ecf5ff)",
      "--up-warning": "var(--up-light-warning, #f9ae3d)",
      "--up-warning-dark": "var(--up-light-warning-dark, #f1a532)",
      "--up-warning-disabled": "var(--up-light-warning-disabled, #f9d39b)",
      "--up-warning-light": "var(--up-light-warning-light, #fdf6ec)",
      "--up-success": "var(--up-light-success, #5ac725)",
      "--up-success-dark": "var(--up-light-success-dark, #53c21d)",
      "--up-success-disabled": "var(--up-light-success-disabled, #a9e08f)",
      "--up-success-light": "var(--up-light-success-light, #f5fff0)",
      "--up-error": "var(--up-light-error, #f56c6c)",
      "--up-error-dark": "var(--up-light-error-dark, #e45656)",
      "--up-error-disabled": "var(--up-light-error-disabled, #f7b2b2)",
      "--up-error-light": "var(--up-light-error-light, #fef0f0)",
      "--up-info": "var(--up-light-info, #909399)",
      "--up-info-dark": "var(--up-light-info-dark, #767a82)",
      "--up-info-disabled": "var(--up-light-info-disabled, #c4c6c9)",
      "--up-info-light": "var(--up-light-info-light, #f4f4f5)"
    },
    dark: {
      "--up-main-color": "#f5f5f5",
      "--up-content-color": "#d1d5db",
      "--up-tips-color": "#9ca3af",
      "--up-light-color": "#6b7280",
      "--up-border-color": "#3a3a3c",
      "--up-bg-color": "#1f1f1f",
      "--up-hover-bg-color": "#343741",
      "--up-page-bg-color": "#1f1f1f",
      "--up-card-bg-color": "#1c1c1e",
      "--up-navbar-bg-color": "#1c1c1e",
      "--up-navbar-glass-bg-color": "rgba(28, 28, 30, 0.82)",
      "--up-navbar-glass-blur": "20px",
      "--up-table2-header-bg-color": "#2a2d33",
      "--up-table2-zebra-bg-color": "#23262b",
      "--up-table2-highlight-bg-color": "#2f3440",
      "--up-gap-bg-color": "#111111",
      "--up-skeleton-bg-color": "#2f3135",
      "--up-skeleton-shimmer-color": "rgba(255, 255, 255, 0.12)",
      "--up-swipe-action-button-bg-color": "#4b5563",
      "--up-index-list-indicator-bg-color": "#4b5563",
      "--up-calendar-month-mark-color": "rgba(255, 255, 255, 0.04)",
      "--up-disabled-color": "#4b5563",
      "--up-primary": "#3c9cff",
      "--up-primary-dark": "#5aa8ff",
      "--up-primary-disabled": "#4c6f92",
      "--up-primary-light": "#10243a",
      "--up-warning": "#f9ae3d",
      "--up-warning-dark": "#ffbf66",
      "--up-warning-disabled": "#8a6a3a",
      "--up-warning-light": "#3d2f1b",
      "--up-success": "#5ac725",
      "--up-success-dark": "#7ad94b",
      "--up-success-disabled": "#5f7f4f",
      "--up-success-light": "#1f3316",
      "--up-error": "#f56c6c",
      "--up-error-dark": "#ff8a8a",
      "--up-error-disabled": "#8d5858",
      "--up-error-light": "#3a2222",
      "--up-info": "#909399",
      "--up-info-dark": "#b0b3b8",
      "--up-info-disabled": "#5f6368",
      "--up-info-light": "#2f3238"
    }
  };
  const THEME_COLOR_SYNC_MAP = {
    "--up-main-color": "mainColor",
    "--up-content-color": "contentColor",
    "--up-tips-color": "tipsColor",
    "--up-light-color": "lightColor",
    "--up-border-color": "borderColor",
    "--up-bg-color": "bgColor",
    "--up-disabled-color": "disabledColor",
    "--up-primary": "primary",
    "--up-primary-dark": "primaryDark",
    "--up-primary-disabled": "primaryDisabled",
    "--up-primary-light": "primaryLight",
    "--up-warning": "warning",
    "--up-warning-dark": "warningDark",
    "--up-warning-disabled": "warningDisabled",
    "--up-warning-light": "warningLight",
    "--up-success": "success",
    "--up-success-dark": "successDark",
    "--up-success-disabled": "successDisabled",
    "--up-success-light": "successLight",
    "--up-error": "error",
    "--up-error-dark": "errorDark",
    "--up-error-disabled": "errorDisabled",
    "--up-error-light": "errorLight",
    "--up-info": "info",
    "--up-info-dark": "infoDark",
    "--up-info-disabled": "infoDisabled",
    "--up-info-light": "infoLight"
  };
  function buildFallbackAliasVars(vars) {
    const aliasVars = {};
    Object.keys(vars).forEach((key) => {
      if (typeof key === "string" && key.indexOf("--up-") === 0) {
        aliasVars[key.replace("--up-", "--u-")] = vars[key];
      }
    });
    return aliasVars;
  }
  function getRuntimeU(upU) {
    if (upU)
      return upU;
    if (typeof uni !== "undefined")
      return uni.$u;
    return null;
  }
  function normalizeRuntimeRoute(route2) {
    if (typeof route2 !== "string")
      return "";
    return route2.replace(/^\//, "").split("?")[0];
  }
  function getCurrentRuntimeRoute() {
    try {
      if (typeof getCurrentPages !== "function")
        return "";
      const pages2 = getCurrentPages();
      if (!Array.isArray(pages2) || pages2.length === 0)
        return "";
      const page2 = pages2[pages2.length - 1] || {};
      return normalizeRuntimeRoute(page2.route || page2.path || "");
    } catch (e) {
    }
    return "";
  }
  function getRuntimeTabBarRoutes() {
    var _a;
    const routes = [];
    try {
      const runtimeConfig = typeof __uniConfig !== "undefined" ? __uniConfig : null;
      const tabBarList = (_a = runtimeConfig == null ? void 0 : runtimeConfig.tabBar) == null ? void 0 : _a.list;
      if (Array.isArray(tabBarList)) {
        tabBarList.forEach((item) => {
          const route2 = normalizeRuntimeRoute((item == null ? void 0 : item.pagePath) || "");
          if (route2)
            routes.push(route2);
        });
      }
    } catch (e) {
    }
    return routes;
  }
  function hasActiveRuntimePage$1() {
    try {
      if (typeof getCurrentPages === "function") {
        const pages2 = getCurrentPages();
        return Array.isArray(pages2) && pages2.length > 0;
      }
    } catch (e) {
    }
    return false;
  }
  function trySetNavigationBarColor$1(options) {
    if (typeof uni === "undefined" || typeof uni.setNavigationBarColor !== "function")
      return;
    if (!hasActiveRuntimePage$1())
      return;
    try {
      const result = uni.setNavigationBarColor(options);
      if (result && typeof result.catch === "function") {
        result.catch(() => {
        });
      }
    } catch (e) {
    }
  }
  function isTabBarPage() {
    const route2 = getCurrentRuntimeRoute();
    if (!route2)
      return false;
    const tabBarRoutes = getRuntimeTabBarRoutes();
    if (!tabBarRoutes.length)
      return false;
    return tabBarRoutes.includes(route2);
  }
  function trySetTabBarStyle(options) {
    if (typeof uni === "undefined" || typeof uni.setTabBarStyle !== "function")
      return;
    if (!isTabBarPage())
      return;
    try {
      const result = uni.setTabBarStyle(options);
      if (result && typeof result.catch === "function") {
        result.catch(() => {
        });
      }
    } catch (e) {
    }
  }
  function normalizeThemeMode$1(theme = "light") {
    return theme === "dark" ? "dark" : "light";
  }
  function normalizeThemePreference$1(mode = "system") {
    return mode === "dark" || mode === "light" ? mode : "system";
  }
  function getFallbackSystemTheme() {
    let theme = "light";
    try {
      if (typeof uni !== "undefined" && typeof uni.getAppBaseInfo === "function") {
        const appBaseInfo = uni.getAppBaseInfo() || {};
        if (appBaseInfo.theme)
          theme = appBaseInfo.theme;
      }
      if (typeof uni !== "undefined" && typeof uni.getSystemInfoSync === "function") {
        const systemInfo = uni.getSystemInfoSync() || {};
        if (systemInfo.theme)
          theme = systemInfo.theme;
      }
    } catch (e) {
      theme = "light";
    }
    return normalizeThemeMode$1(theme);
  }
  function getFallbackThemePreference() {
    try {
      if (typeof uni !== "undefined" && typeof uni.getStorageSync === "function") {
        const preference = uni.getStorageSync(THEME_MODE_STORAGE_KEY$1);
        return normalizeThemePreference$1(preference);
      }
    } catch (e) {
    }
    return "system";
  }
  function getFallbackThemeMode() {
    const preference = getFallbackThemePreference();
    if (preference === "dark" || preference === "light")
      return preference;
    return getFallbackSystemTheme();
  }
  function getFallbackThemeVarsByMode(mode) {
    const vars = FALLBACK_THEME_VARS[normalizeThemeMode$1(mode)] || FALLBACK_THEME_VARS.light;
    return {
      ...vars,
      ...buildFallbackAliasVars(vars)
    };
  }
  function getFallbackThemeVars(upU) {
    const mode = getThemeIsDark(upU) ? "dark" : "light";
    return getFallbackThemeVarsByMode(mode);
  }
  function syncRuntimeColor(runtimeU, vars) {
    if (!runtimeU || !runtimeU.color)
      return;
    Object.keys(THEME_COLOR_SYNC_MAP).forEach((token) => {
      const field = THEME_COLOR_SYNC_MAP[token];
      runtimeU.color[field] = vars[token];
    });
  }
  function syncThemeRuntimeFromStorage(upU) {
    const runtimeU = getRuntimeU(upU);
    if (!runtimeU || !runtimeU.theme)
      return runtimeU == null ? void 0 : runtimeU.theme;
    const preference = getFallbackThemePreference();
    const mode = preference === "system" ? getFallbackSystemTheme() : preference;
    const vars = getFallbackThemeVarsByMode(mode);
    const shouldUpdate = runtimeU.theme.preference !== preference || runtimeU.theme.mode !== mode;
    if (shouldUpdate && typeof runtimeU.setThemePreference === "function") {
      return runtimeU.setThemePreference(preference) || runtimeU.theme;
    }
    runtimeU.theme.preference = preference;
    runtimeU.theme.mode = mode;
    runtimeU.theme.vars = {
      ...vars,
      ...runtimeU.theme.vars && !shouldUpdate ? runtimeU.theme.vars : {}
    };
    if (shouldUpdate) {
      runtimeU.theme.version = Number(runtimeU.theme.version || 0) + 1;
    }
    syncRuntimeColor(runtimeU, runtimeU.theme.vars);
    return runtimeU.theme;
  }
  function getThemeIsDark(upU) {
    var _a, _b;
    const runtimeMode = (_b = (_a = getRuntimeU(upU)) == null ? void 0 : _a.theme) == null ? void 0 : _b.mode;
    if (runtimeMode)
      return runtimeMode === "dark";
    return getFallbackThemeMode() === "dark";
  }
  function getThemeVarsForStyle(upU) {
    const runtimeU = getRuntimeU(upU);
    if (runtimeU && typeof runtimeU.getThemeVars === "function") {
      return runtimeU.getThemeVars();
    }
    return getFallbackThemeVars(runtimeU);
  }
  function getThemeVar(varName, fallbackColor, upU) {
    var _a, _b;
    const runtimeU = getRuntimeU(upU);
    const themeVars = (_a = runtimeU == null ? void 0 : runtimeU.theme) == null ? void 0 : _a.vars;
    if (themeVars && Object.prototype.hasOwnProperty.call(themeVars, varName)) {
      return themeVars[varName];
    }
    if (typeof varName === "string") {
      const aliasVarName = varName.indexOf("--up-") === 0 ? varName.replace("--up-", "--u-") : varName.indexOf("--u-") === 0 ? varName.replace("--u-", "--up-") : "";
      if (aliasVarName && themeVars && Object.prototype.hasOwnProperty.call(themeVars, aliasVarName)) {
        return themeVars[aliasVarName];
      }
      const runtimeColorMap = ((_b = runtimeU == null ? void 0 : runtimeU.config) == null ? void 0 : _b.color) || {};
      const colorTokenKey = varName.indexOf("--") === 0 ? varName.slice(2) : varName;
      if (Object.prototype.hasOwnProperty.call(runtimeColorMap, colorTokenKey)) {
        return runtimeColorMap[colorTokenKey];
      }
      const aliasColorTokenKey = colorTokenKey.indexOf("up-") === 0 ? colorTokenKey.replace("up-", "u-") : colorTokenKey.indexOf("u-") === 0 ? colorTokenKey.replace("u-", "up-") : "";
      if (aliasColorTokenKey && Object.prototype.hasOwnProperty.call(runtimeColorMap, aliasColorTokenKey)) {
        return runtimeColorMap[aliasColorTokenKey];
      }
    }
    if (runtimeU && typeof runtimeU.getThemeVars === "function") {
      const vars = runtimeU.getThemeVars();
      if (vars && Object.prototype.hasOwnProperty.call(vars, varName)) {
        return vars[varName];
      }
    }
    const fallbackVars = getFallbackThemeVars(runtimeU);
    if (fallbackVars && Object.prototype.hasOwnProperty.call(fallbackVars, varName)) {
      return fallbackVars[varName];
    }
    return typeof fallbackColor !== "undefined" ? fallbackColor : "";
  }
  function getThemePageStyle(upU, preferCssVars = false) {
    var _a;
    const runtimeU = getRuntimeU(upU);
    const isDark = getThemeIsDark(runtimeU);
    const fallbackBg = isDark ? "#1f1f1f" : ((_a = runtimeU == null ? void 0 : runtimeU.color) == null ? void 0 : _a.bgColor) || "#f3f4f6";
    if (preferCssVars) {
      return {
        ...getThemeVarsForStyle(runtimeU),
        minHeight: "100vh",
        backgroundColor: `var(--up-page-bg-color, var(--up-bg-color, ${fallbackBg}))`
      };
    }
    return {
      backgroundColor: getThemeVar(
        "--up-page-bg-color",
        getThemeVar("--up-bg-color", fallbackBg, runtimeU),
        runtimeU
      )
    };
  }
  function getThemeCardStyle(upU, preferCssVars = false) {
    var _a;
    const runtimeU = getRuntimeU(upU);
    const isDark = getThemeIsDark(runtimeU);
    const fallbackCard = isDark ? "#1c1c1e" : "#ffffff";
    const fallbackBorder = ((_a = runtimeU == null ? void 0 : runtimeU.color) == null ? void 0 : _a.borderColor) || "#dadbde";
    if (preferCssVars) {
      return {
        backgroundColor: `var(--up-card-bg-color, ${fallbackCard})`,
        borderColor: `var(--up-border-color, ${fallbackBorder})`
      };
    }
    return {
      backgroundColor: getThemeVar("--up-card-bg-color", fallbackCard, runtimeU),
      borderColor: getThemeVar("--up-border-color", fallbackBorder, runtimeU)
    };
  }
  function getThemeTabBarStyle(upU) {
    const runtimeU = getRuntimeU(upU);
    const isDark = getThemeIsDark(runtimeU);
    return {
      color: isDark ? "#8e8e93" : "#909399",
      selectedColor: isDark ? "#f2f2f7" : "#303133",
      backgroundColor: isDark ? "#111111" : "#ffffff",
      borderStyle: isDark ? "white" : "black"
    };
  }
  function applyNativeThemeUI$1(upU) {
    var _a, _b;
    if (typeof uni === "undefined")
      return;
    const runtimeU = getRuntimeU(upU);
    if (((_a = runtimeU == null ? void 0 : runtimeU.config) == null ? void 0 : _a.nativeThemeSync) !== true)
      return;
    const isDark = getThemeIsDark(runtimeU);
    const fallbackBg = isDark ? "#1f1f1f" : ((_b = runtimeU == null ? void 0 : runtimeU.color) == null ? void 0 : _b.bgColor) || "#f3f4f6";
    const pageBg = getThemeVar(
      "--up-page-bg-color",
      getThemeVar("--up-bg-color", fallbackBg, runtimeU),
      runtimeU
    );
    const navBg = getThemeVar(
      "--up-navbar-bg-color",
      isDark ? "#1c1c1e" : "#ffffff",
      runtimeU
    );
    trySetNavigationBarColor$1({
      frontColor: isDark ? "#ffffff" : "#000000",
      backgroundColor: navBg,
      animation: {
        duration: 0,
        timingFunc: "linear"
      }
    });
    if (typeof uni.setBackgroundColor === "function") {
      uni.setBackgroundColor({
        backgroundColor: pageBg,
        backgroundColorTop: pageBg,
        backgroundColorBottom: pageBg
      });
    }
    trySetTabBarStyle(getThemeTabBarStyle(runtimeU));
  }
  function applyNativeThemeUIDeferred(upU, delay = 30) {
    applyNativeThemeUI$1(upU);
    if (typeof setTimeout === "function") {
      setTimeout(() => {
        applyNativeThemeUI$1(upU);
      }, delay);
    }
  }
  const mixin = defineMixin({
    // 定义每个组件都可能需要用到的外部样式以及类名
    props: {
      // 每个组件都有的父组件传递的样式，可以为字符串或者对象形式
      customStyle: {
        type: [Object, String],
        default: () => ({})
      },
      customClass: {
        type: String,
        default: ""
      },
      // 跳转的页面路径
      url: {
        type: String,
        default: ""
      },
      // 页面跳转的类型
      linkType: {
        type: String,
        default: "navigateTo"
      }
    },
    data() {
      return {
        __upPageThemeChangeHandler: null,
        upThemeVersion: 0
      };
    },
    onLoad() {
      this.upBindGetRect();
      this.upInitThemeVersion();
      if (this.upIsPageScope()) {
        this.upApplyNativeThemeUI();
        if (typeof uni !== "undefined" && typeof uni.$on === "function" && !this.__upPageThemeChangeHandler) {
          this.__upPageThemeChangeHandler = () => {
            this.upApplyNativeThemeUI();
          };
          uni.$on("uThemeChange", this.__upPageThemeChangeHandler);
        }
      }
    },
    onShow() {
      if (this.upIsPageScope()) {
        this.upApplyNativeThemeUI();
      }
    },
    created() {
      this.upBindGetRect();
      this.upInitThemeVersion();
      if (typeof uni !== "undefined" && typeof uni.$on === "function") {
        this.__uThemeChangeHandler = (payload = {}) => {
          this.upSyncThemeVersion(payload);
          this.upClearUCache();
          if (typeof this.$forceUpdate === "function") {
            this.$forceUpdate();
          }
        };
        uni.$on("uThemeChange", this.__uThemeChangeHandler);
      }
    },
    computed: {
      // 在2.x版本中，将会把$u挂载到uni对象下，导致在模板中无法使用uni.$u.xxx形式
      // 所以这里通过computed计算属性将其附加到this.$u上，就可以在模板或者js中使用uni.$u.xxx
      // 只在nvue环境通过此方式引入完整的$u，其他平台会出现性能问题，非nvue则按需引入（主要原因是props过大）
      $u() {
        this.upThemeVersion;
        const instance = this.$;
        if (instance == null ? void 0 : instance.__upUCache) {
          return instance.__upUCache;
        }
        const globalU = typeof uni !== "undefined" ? uni.$u : null;
        if (!globalU || typeof globalU !== "object")
          return false;
        let mergeU = Object.assign({}, globalU);
        mergeU.props = void 0;
        mergeU.http = void 0;
        mergeU.mixin = void 0;
        if (instance) {
          instance.__upUCache = mergeU;
          return instance.__upUCache;
        }
        return mergeU;
      },
      upThemeIsDark() {
        this.upThemeVersion;
        return getThemeIsDark(this.$u);
      },
      upThemeVars() {
        this.upThemeVersion;
        return getThemeVarsForStyle(this.$u);
      },
      upThemePageStyle() {
        this.upThemeVersion;
        return getThemePageStyle(this.$u);
      },
      upThemeCardStyle() {
        this.upThemeVersion;
        return getThemeCardStyle(this.$u);
      },
      /**
       * 生成bem规则类名
       * 由于微信小程序，H5，nvue之间绑定class的差异，无法通过:class="[bem()]"的形式进行同用
       * 故采用如下折中做法，最后返回的是数组（一般平台）或字符串（支付宝和字节跳动平台），类似['a', 'b', 'c']或'a b c'的形式
       * @param {String} name 组件名称
       * @param {Array} fixed 一直会存在的类名
       * @param {Array} change 会根据变量值为true或者false而出现或者隐藏的类名
       * @returns {Array|string}
       */
      bem() {
        return function(name, fixed, change) {
          const prefix = `u-${name}--`;
          const classes = {};
          if (fixed) {
            fixed.map((item) => {
              classes[prefix + this[item]] = true;
            });
          }
          if (change) {
            change.map((item) => {
              this[item] ? classes[prefix + item] = this[item] : delete classes[prefix + item];
            });
          }
          return Object.keys(classes);
        };
      }
    },
    methods: {
      upClearUCache() {
        if (this.$) {
          this.$.__upUCache = null;
        }
      },
      upBindGetRect() {
        const upU = this.$u || (typeof uni !== "undefined" ? uni.$u : null);
        if (upU) {
          upU.getRect = this.$uGetRect;
        } else if (typeof uni !== "undefined") {
          uni.$u = {
            getRect: this.$uGetRect
          };
        }
      },
      upReadThemeVersion() {
        return Number(typeof uni !== "undefined" && uni.$u && uni.$u.theme && uni.$u.theme.version || 0);
      },
      upInitThemeVersion() {
        const version2 = this.upReadThemeVersion();
        if (version2) {
          this.upThemeVersion = version2;
        }
      },
      upSyncThemeVersion(payload = {}) {
        const version2 = Number(payload.version || this.upReadThemeVersion() || 0);
        this.upThemeVersion = version2 || Number(this.upThemeVersion || 0) + 1;
      },
      upIsPageScope() {
        var _a;
        return !!(this.$page || this.route || ((_a = this.$options) == null ? void 0 : _a.mpType) === "page");
      },
      upHasProp(propName) {
        var _a, _b;
        const vnodeProps = ((_b = (_a = this.$) == null ? void 0 : _a.vnode) == null ? void 0 : _b.props) || {};
        const kebabName = propName.replace(/[A-Z]/g, (s) => `-${s.toLowerCase()}`);
        return Object.prototype.hasOwnProperty.call(vnodeProps, propName) || Object.prototype.hasOwnProperty.call(vnodeProps, kebabName);
      },
      upThemeVar(varName, fallbackColor) {
        this.upThemeVersion;
        return getThemeVar(varName, fallbackColor, this.$u);
      },
      upApplyNativeThemeUI() {
        syncThemeRuntimeFromStorage(this.$u);
        this.upSyncThemeVersion();
        applyNativeThemeUIDeferred(this.$u);
      },
      // 跳转某一个页面
      openPage(urlKey = "url") {
        const url2 = this[urlKey];
        if (url2) {
          route({ type: this.linkType, url: url2 });
        }
      },
      navTo(url2 = "", linkType = "navigateTo") {
        route({ type: this.linkType, url: url2 });
      },
      $uGetRect(selector, all = false) {
        return upGetRect(selector, all, this);
      },
      getParentData(parentName = "") {
        if (!this.parent)
          this.parent = {};
        this.parent = $parent.call(this, parentName);
        if (this.parent && this.parent.children) {
          this.parent.children.indexOf(this) === -1 && this.parent.children.push(this);
        }
        if (this.parent && this.parentData) {
          Object.keys(this.parentData).map((key) => {
            this.parentData[key] = this.parent[key];
          });
        }
      },
      // 阻止事件冒泡
      preventEvent(e) {
        e && typeof e.stopPropagation === "function" && e.stopPropagation();
      },
      // 空操作
      noop(e) {
        this.preventEvent(e);
      }
    },
    onReachBottom() {
      uni.$emit("uOnReachBottom");
    },
    beforeUnmount() {
      this.__upUnmounted = true;
      if (this.parent && test.array(this.parent.children)) {
        const childrenList = this.parent.children;
        childrenList.map((child, index2) => {
          if (child === this) {
            childrenList.splice(index2, 1);
          }
        });
      }
      if (typeof uni !== "undefined" && typeof uni.$off === "function" && this.__uThemeChangeHandler) {
        uni.$off("uThemeChange", this.__uThemeChangeHandler);
        this.__uThemeChangeHandler = null;
      }
      if (typeof uni !== "undefined" && typeof uni.$off === "function" && this.__upPageThemeChangeHandler) {
        uni.$off("uThemeChange", this.__upPageThemeChangeHandler);
        this.__upPageThemeChangeHandler = null;
      }
    }
  });
  const getClassNames = (name) => ({
    enter: `u-${name}-enter u-${name}-enter-active`,
    "enter-to": `u-${name}-enter-to u-${name}-enter-active`,
    leave: `u-${name}-leave u-${name}-leave-active`,
    "leave-to": `u-${name}-leave-to u-${name}-leave-active`
  });
  const transitionMixin = {
    methods: {
      // 组件被点击发出事件
      clickHandler() {
        this.$emit("click");
      },
      // vue版本的组件进场处理
      async vueEnter() {
        const classNames = getClassNames(this.mode);
        this.status = "enter";
        this.$emit("beforeEnter");
        this.inited = true;
        this.display = true;
        this.classes = classNames.enter;
        await vue.nextTick();
        {
          await sleep(20);
          this.$emit("enter");
          this.transitionEnded = false;
          this.$emit("afterEnter");
          this.classes = classNames["enter-to"];
        }
      },
      // 动画离场处理
      async vueLeave() {
        if (!this.display)
          return;
        const classNames = getClassNames(this.mode);
        this.status = "leave";
        this.$emit("beforeLeave");
        this.classes = classNames.leave;
        await vue.nextTick();
        {
          this.transitionEnded = false;
          this.$emit("leave");
          setTimeout(this.onTransitionEnd, this.duration);
          this.classes = classNames["leave-to"];
        }
      },
      // 完成过渡后触发
      onTransitionEnd() {
        if (this.transitionEnded)
          return;
        this.transitionEnded = true;
        this.$emit(this.status === "leave" ? "afterLeave" : "afterEnter");
        if (!this.show && this.display) {
          this.display = false;
          this.inited = false;
        }
      }
    }
  };
  const _export_sfc = (sfc, props2) => {
    const target = sfc.__vccOpts || sfc;
    for (const [key, val] of props2) {
      target[key] = val;
    }
    return target;
  };
  const _sfc_main$t = {
    name: "u-transition",
    data() {
      return {
        inited: false,
        // 是否显示/隐藏组件
        viewStyle: {},
        // 组件内部的样式
        status: "",
        // 记录组件动画的状态
        transitionEnded: false,
        // 组件是否结束的标记
        display: false,
        // 组件是否展示
        classes: ""
        // 应用的类名
      };
    },
    emits: ["click", "beforeEnter", "enter", "afterEnter", "beforeLeave", "leave", "afterLeave"],
    computed: {
      mergeStyle() {
        const { viewStyle, customStyle } = this;
        return {
          transitionDuration: `${this.duration}ms`,
          // display: `${this.display ? '' : 'none'}`,
          transitionTimingFunction: this.timingFunction,
          // 避免自定义样式影响到动画属性，所以写在viewStyle前面
          ...addStyle(customStyle),
          ...viewStyle
        };
      }
    },
    // 将mixin挂在到组件中，实际上为一个vue格式对象。
    mixins: [mpMixin, mixin, transitionMixin, props$6],
    watch: {
      show: {
        handler(newVal) {
          newVal ? this.vueEnter() : this.vueLeave();
        },
        // 表示同时监听初始化时的props的show的意思
        immediate: true
      }
    }
  };
  function _sfc_render$s(_ctx, _cache, $props, $setup, $data, $options) {
    return $data.inited ? (vue.openBlock(), vue.createElementBlock(
      "view",
      {
        key: 0,
        class: vue.normalizeClass(["u-transition", $data.classes]),
        ref: "u-transition",
        onClick: _cache[0] || (_cache[0] = (...args) => _ctx.clickHandler && _ctx.clickHandler(...args)),
        style: vue.normalizeStyle([$options.mergeStyle])
      },
      [
        vue.renderSlot(_ctx.$slots, "default", {}, void 0, true)
      ],
      6
      /* CLASS, STYLE */
    )) : vue.createCommentVNode("v-if", true);
  }
  const __easycom_4 = /* @__PURE__ */ _export_sfc(_sfc_main$t, [["render", _sfc_render$s], ["__scopeId", "data-v-0573594d"], ["__file", "D:/workZone/APP/frontend/node_modules/uview-plus/components/u-transition/u-transition.vue"]]);
  const ON_SHOW = "onShow";
  const ON_LOAD = "onLoad";
  function formatAppLog(type, filename, ...args) {
    if (uni.__log__) {
      uni.__log__(type, filename, ...args);
    } else {
      console[type].apply(console, [...args, filename]);
    }
  }
  function resolveEasycom(component, easycom) {
    return typeof component === "string" ? easycom : component;
  }
  const createLifeCycleHook = (lifecycle, flag2 = 0) => (hook, target = vue.getCurrentInstance()) => {
    if (vue.isInSSRComponentSetup)
      return;
    vue.injectHook(lifecycle, hook, target);
  };
  const onShow = /* @__PURE__ */ createLifeCycleHook(
    ON_SHOW,
    2
    /* HookFlags.PAGE */
  );
  const onLoad = /* @__PURE__ */ createLifeCycleHook(
    ON_LOAD,
    2
    /* HookFlags.PAGE */
  );
  const OverlayDefaultProps = {
    // overlay组件
    overlay: {
      show: false,
      zIndex: 10070,
      duration: 300,
      opacity: 0.5
    }
  };
  const defProps$4 = registerComponentProps(OverlayDefaultProps);
  const props$5 = defineMixin({
    props: {
      // 是否显示遮罩
      show: {
        type: Boolean,
        default: () => defProps$4.overlay.show
      },
      // 层级z-index
      zIndex: {
        type: [String, Number],
        default: () => defProps$4.overlay.zIndex
      },
      // 遮罩的过渡时间，单位为ms
      duration: {
        type: [String, Number],
        default: () => defProps$4.overlay.duration
      },
      // 不透明度值，当做rgba的第四个参数
      opacity: {
        type: [String, Number],
        default: () => defProps$4.overlay.opacity
      }
    }
  });
  const _sfc_main$s = {
    name: "u-overlay",
    mixins: [mpMixin, mixin, props$5],
    computed: {
      overlayStyle() {
        const style = {
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: this.zIndex,
          bottom: 0,
          "background-color": `rgba(0, 0, 0, ${this.opacity})`
        };
        return deepMerge(style, addStyle(this.customStyle));
      }
    },
    emits: ["click"],
    methods: {
      clickHandler() {
        this.$emit("click");
      }
    }
  };
  function _sfc_render$r(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_u_transition = resolveEasycom(vue.resolveDynamicComponent("u-transition"), __easycom_4);
    return vue.openBlock(), vue.createBlock(_component_u_transition, {
      show: _ctx.show,
      "custom-class": "u-overlay",
      duration: _ctx.duration,
      "custom-style": $options.overlayStyle,
      onClick: $options.clickHandler,
      onTouchmove: vue.withModifiers(_ctx.noop, ["stop", "prevent"])
    }, {
      default: vue.withCtx(() => [
        vue.renderSlot(_ctx.$slots, "default", {}, void 0, true)
      ]),
      _: 3
      /* FORWARDED */
    }, 8, ["show", "duration", "custom-style", "onClick", "onTouchmove"]);
  }
  const __easycom_0$2 = /* @__PURE__ */ _export_sfc(_sfc_main$s, [["render", _sfc_render$r], ["__scopeId", "data-v-35f7c3e5"], ["__file", "D:/workZone/APP/frontend/node_modules/uview-plus/components/u-overlay/u-overlay.vue"]]);
  const StatusBarDefaultProps = {
    // statusBar
    statusBar: {
      bgColor: "transparent",
      height: 0
    }
  };
  const defProps$3 = registerComponentProps(StatusBarDefaultProps);
  const props$4 = defineMixin({
    props: {
      bgColor: {
        type: String,
        default: () => defProps$3.statusBar.bgColor
      },
      // 状态栏获取得高度
      height: {
        type: Number,
        default: () => defProps$3.statusBar.height
      }
    }
  });
  const _sfc_main$r = {
    name: "u-status-bar",
    mixins: [mpMixin, mixin, props$4],
    data() {
      return {
        isH5: false
      };
    },
    created() {
    },
    emits: ["update:height"],
    computed: {
      style() {
        const style = {};
        let sheight = getWindowInfo().statusBarHeight;
        this.$emit("update:height", sheight);
        if (sheight == 0) {
          this.isH5 = true;
        } else {
          style.height = addUnit(sheight, "px");
        }
        style.backgroundColor = this.bgColor;
        return deepMerge(style, addStyle(this.customStyle));
      }
    }
  };
  function _sfc_render$q(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock(
      "view",
      {
        style: vue.normalizeStyle([$options.style]),
        class: vue.normalizeClass(["u-status-bar", [$data.isH5 && "u-safe-area-inset-top"]])
      },
      [
        vue.renderSlot(_ctx.$slots, "default", {}, void 0, true)
      ],
      6
      /* CLASS, STYLE */
    );
  }
  const __easycom_1 = /* @__PURE__ */ _export_sfc(_sfc_main$r, [["render", _sfc_render$q], ["__scopeId", "data-v-c0b45a48"], ["__file", "D:/workZone/APP/frontend/node_modules/uview-plus/components/u-status-bar/u-status-bar.vue"]]);
  const icons = {
    "uicon-level": "",
    "uicon-column-line": "",
    "uicon-checkbox-mark": "",
    "uicon-folder": "",
    "uicon-movie": "",
    "uicon-star-fill": "",
    "uicon-star": "",
    "uicon-phone-fill": "",
    "uicon-phone": "",
    "uicon-apple-fill": "",
    "uicon-chrome-circle-fill": "",
    "uicon-backspace": "",
    "uicon-attach": "",
    "uicon-cut": "",
    "uicon-empty-car": "",
    "uicon-empty-coupon": "",
    "uicon-empty-address": "",
    "uicon-empty-favor": "",
    "uicon-empty-permission": "",
    "uicon-empty-news": "",
    "uicon-empty-search": "",
    "uicon-github-circle-fill": "",
    "uicon-rmb": "",
    "uicon-person-delete-fill": "",
    "uicon-reload": "",
    "uicon-order": "",
    "uicon-server-man": "",
    "uicon-search": "",
    "uicon-fingerprint": "",
    "uicon-more-dot-fill": "",
    "uicon-scan": "",
    "uicon-share-square": "",
    "uicon-map": "",
    "uicon-map-fill": "",
    "uicon-tags": "",
    "uicon-tags-fill": "",
    "uicon-bookmark-fill": "",
    "uicon-bookmark": "",
    "uicon-eye": "",
    "uicon-eye-fill": "",
    "uicon-mic": "",
    "uicon-mic-off": "",
    "uicon-calendar": "",
    "uicon-calendar-fill": "",
    "uicon-trash": "",
    "uicon-trash-fill": "",
    "uicon-play-left": "",
    "uicon-play-right": "",
    "uicon-minus": "",
    "uicon-plus": "",
    "uicon-info": "",
    "uicon-info-circle": "",
    "uicon-info-circle-fill": "",
    "uicon-question": "",
    "uicon-error": "",
    "uicon-close": "",
    "uicon-checkmark": "",
    "uicon-android-circle-fill": "",
    "uicon-android-fill": "",
    "uicon-ie": "",
    "uicon-IE-circle-fill": "",
    "uicon-google": "",
    "uicon-google-circle-fill": "",
    "uicon-setting-fill": "",
    "uicon-setting": "",
    "uicon-minus-square-fill": "",
    "uicon-plus-square-fill": "",
    "uicon-heart": "",
    "uicon-heart-fill": "",
    "uicon-camera": "",
    "uicon-camera-fill": "",
    "uicon-more-circle": "",
    "uicon-more-circle-fill": "",
    "uicon-chat": "",
    "uicon-chat-fill": "",
    "uicon-bag-fill": "",
    "uicon-bag": "",
    "uicon-error-circle-fill": "",
    "uicon-error-circle": "",
    "uicon-close-circle": "",
    "uicon-close-circle-fill": "",
    "uicon-checkmark-circle": "",
    "uicon-checkmark-circle-fill": "",
    "uicon-question-circle-fill": "",
    "uicon-question-circle": "",
    "uicon-share": "",
    "uicon-share-fill": "",
    "uicon-shopping-cart": "",
    "uicon-shopping-cart-fill": "",
    "uicon-bell": "",
    "uicon-bell-fill": "",
    "uicon-list": "",
    "uicon-list-dot": "",
    "uicon-zhihu": "",
    "uicon-zhihu-circle-fill": "",
    "uicon-zhifubao": "",
    "uicon-zhifubao-circle-fill": "",
    "uicon-weixin-circle-fill": "",
    "uicon-weixin-fill": "",
    "uicon-twitter-circle-fill": "",
    "uicon-twitter": "",
    "uicon-taobao-circle-fill": "",
    "uicon-taobao": "",
    "uicon-weibo-circle-fill": "",
    "uicon-weibo": "",
    "uicon-qq-fill": "",
    "uicon-qq-circle-fill": "",
    "uicon-moments-circel-fill": "",
    "uicon-moments": "",
    "uicon-qzone": "",
    "uicon-qzone-circle-fill": "",
    "uicon-baidu-circle-fill": "",
    "uicon-baidu": "",
    "uicon-facebook-circle-fill": "",
    "uicon-facebook": "",
    "uicon-car": "",
    "uicon-car-fill": "",
    "uicon-warning-fill": "",
    "uicon-warning": "",
    "uicon-clock-fill": "",
    "uicon-clock": "",
    "uicon-edit-pen": "",
    "uicon-edit-pen-fill": "",
    "uicon-email": "",
    "uicon-email-fill": "",
    "uicon-minus-circle": "",
    "uicon-minus-circle-fill": "",
    "uicon-plus-circle": "",
    "uicon-plus-circle-fill": "",
    "uicon-file-text": "",
    "uicon-file-text-fill": "",
    "uicon-pushpin": "",
    "uicon-pushpin-fill": "",
    "uicon-grid": "",
    "uicon-grid-fill": "",
    "uicon-play-circle": "",
    "uicon-play-circle-fill": "",
    "uicon-pause-circle-fill": "",
    "uicon-pause": "",
    "uicon-pause-circle": "",
    "uicon-eye-off": "",
    "uicon-eye-off-outline": "",
    "uicon-gift-fill": "",
    "uicon-gift": "",
    "uicon-rmb-circle-fill": "",
    "uicon-rmb-circle": "",
    "uicon-kefu-ermai": "",
    "uicon-server-fill": "",
    "uicon-coupon-fill": "",
    "uicon-coupon": "",
    "uicon-integral": "",
    "uicon-integral-fill": "",
    "uicon-home-fill": "",
    "uicon-home": "",
    "uicon-hourglass-half-fill": "",
    "uicon-hourglass": "",
    "uicon-account": "",
    "uicon-plus-people-fill": "",
    "uicon-minus-people-fill": "",
    "uicon-account-fill": "",
    "uicon-thumb-down-fill": "",
    "uicon-thumb-down": "",
    "uicon-thumb-up": "",
    "uicon-thumb-up-fill": "",
    "uicon-lock-fill": "",
    "uicon-lock-open": "",
    "uicon-lock-opened-fill": "",
    "uicon-lock": "",
    "uicon-red-packet-fill": "",
    "uicon-photo-fill": "",
    "uicon-photo": "",
    "uicon-volume-off-fill": "",
    "uicon-volume-off": "",
    "uicon-volume-fill": "",
    "uicon-volume": "",
    "uicon-red-packet": "",
    "uicon-download": "",
    "uicon-arrow-up-fill": "",
    "uicon-arrow-down-fill": "",
    "uicon-play-left-fill": "",
    "uicon-play-right-fill": "",
    "uicon-rewind-left-fill": "",
    "uicon-rewind-right-fill": "",
    "uicon-arrow-downward": "",
    "uicon-arrow-leftward": "",
    "uicon-arrow-rightward": "",
    "uicon-arrow-upward": "",
    "uicon-arrow-down": "",
    "uicon-arrow-right": "",
    "uicon-arrow-left": "",
    "uicon-arrow-up": "",
    "uicon-skip-back-left": "",
    "uicon-skip-forward-right": "",
    "uicon-rewind-right": "",
    "uicon-rewind-left": "",
    "uicon-arrow-right-double": "",
    "uicon-arrow-left-double": "",
    "uicon-wifi-off": "",
    "uicon-wifi": "",
    "uicon-empty-data": "",
    "uicon-empty-history": "",
    "uicon-empty-list": "",
    "uicon-empty-page": "",
    "uicon-empty-order": "",
    "uicon-empty-wifi": "",
    "uicon-man": "",
    "uicon-woman": "",
    "uicon-man-add": "",
    "uicon-man-add-fill": "",
    "uicon-man-delete": "",
    "uicon-man-delete-fill": "",
    "uicon-zh": "",
    "uicon-en": ""
  };
  const {
    color: color$1
  } = config;
  const IconDefaultProps = {
    // icon组件
    icon: {
      name: "",
      color: color$1["u-content-color"],
      size: "16px",
      bold: false,
      index: "",
      hoverClass: "",
      customPrefix: "uicon",
      label: "",
      labelPos: "right",
      labelSize: "15px",
      labelColor: color$1["u-content-color"],
      space: "3px",
      imgMode: "",
      width: "",
      height: "",
      top: 0,
      stop: false
    }
  };
  const defProps$2 = registerComponentProps(IconDefaultProps);
  const props$3 = defineMixin({
    props: {
      // 图标类名
      name: {
        type: String,
        default: () => defProps$2.icon.name
      },
      // 图标颜色，可接受主题色
      color: {
        type: String,
        default: () => defProps$2.icon.color
      },
      // 字体大小，单位px
      size: {
        type: [String, Number],
        default: () => defProps$2.icon.size
      },
      // 是否显示粗体
      bold: {
        type: Boolean,
        default: () => defProps$2.icon.bold
      },
      // 点击图标的时候传递事件出去的index（用于区分点击了哪一个）
      index: {
        type: [String, Number],
        default: () => defProps$2.icon.index
      },
      // 触摸图标时的类名
      hoverClass: {
        type: String,
        default: () => defProps$2.icon.hoverClass
      },
      // 自定义扩展前缀，方便用户扩展自己的图标库
      customPrefix: {
        type: String,
        default: () => defProps$2.icon.customPrefix
      },
      // 图标右边或者下面的文字
      label: {
        type: [String, Number],
        default: () => defProps$2.icon.label
      },
      // label的位置，只能右边或者下边
      labelPos: {
        type: String,
        default: () => defProps$2.icon.labelPos
      },
      // label的大小
      labelSize: {
        type: [String, Number],
        default: () => defProps$2.icon.labelSize
      },
      // label的颜色
      labelColor: {
        type: String,
        default: () => defProps$2.icon.labelColor
      },
      // label与图标的距离
      space: {
        type: [String, Number],
        default: () => defProps$2.icon.space
      },
      // 图片的mode
      imgMode: {
        type: String,
        default: () => defProps$2.icon.imgMode
      },
      // 用于显示图片小图标时，图片的宽度
      width: {
        type: [String, Number],
        default: () => defProps$2.icon.width
      },
      // 用于显示图片小图标时，图片的高度
      height: {
        type: [String, Number],
        default: () => defProps$2.icon.height
      },
      // 用于解决某些情况下，让图标垂直居中的用途
      top: {
        type: [String, Number],
        default: () => defProps$2.icon.top
      },
      // 是否阻止事件传播
      stop: {
        type: Boolean,
        default: () => defProps$2.icon.stop
      }
    }
  });
  const iconFontFamily = "uicon-iconfont";
  const appIconFontUrl = "_www/static/app-plus/uview-plus/upicon.ttf";
  let params = {
    loaded: false,
    loading: false
  };
  const appVueLoadedPages = /* @__PURE__ */ new WeakSet();
  const appVueLoadingPages = /* @__PURE__ */ new WeakSet();
  const appVueFallbackPages = /* @__PURE__ */ new WeakSet();
  const getCurrentAppVuePage = () => {
    try {
      if (typeof getCurrentPages !== "function")
        return null;
      const pages2 = getCurrentPages();
      if (!Array.isArray(pages2) || pages2.length === 0)
        return null;
      const page2 = pages2[pages2.length - 1];
      return page2 && (typeof page2 === "object" || typeof page2 === "function") ? page2 : null;
    } catch (e) {
      return null;
    }
    return null;
  };
  const isLoaded = () => {
    const page2 = getCurrentAppVuePage();
    return !!page2 && appVueLoadedPages.has(page2);
  };
  const getAppIconUrl = () => {
    if (typeof plus !== "undefined" && plus.io && typeof plus.io.convertLocalFileSystemURL === "function") {
      const iconFontPath = plus.io.convertLocalFileSystemURL(appIconFontUrl);
      return iconFontPath && iconFontPath.startsWith("file://") ? iconFontPath : "file://" + iconFontPath;
    }
    return appIconFontUrl;
  };
  const getIconUrl = () => {
    return getAppIconUrl();
  };
  const registerAppVueFontFace = (iconUrl, appVuePage) => {
    uni.loadFontFace({
      global: true,
      // 是否全局生效。微信小程序 '2.10.0'起支持全局生效，需在 app.vue 中调用。
      family: iconFontFamily,
      source: 'url("' + iconUrl + '")',
      success() {
        appVueLoadingPages.delete(appVuePage);
        appVueLoadedPages.add(appVuePage);
      },
      fail() {
        if (iconUrl !== config.iconUrl && !appVueFallbackPages.has(appVuePage)) {
          appVueFallbackPages.add(appVuePage);
          registerAppVueFontFace(config.iconUrl, appVuePage);
          return;
        }
        appVueLoadingPages.delete(appVuePage);
      }
    });
  };
  const loadFont = () => {
    const appVuePage = getCurrentAppVuePage();
    if (!appVuePage || appVueLoadedPages.has(appVuePage) || appVueLoadingPages.has(appVuePage)) {
      return false;
    }
    appVueLoadingPages.add(appVuePage);
    getIconUrl();
    const appVueIconUrl = appIconFontUrl;
    registerAppVueFontFace(appVueIconUrl, appVuePage);
    if (config.customIcon.family) {
      uni.loadFontFace({
        global: true,
        // 是否全局生效。微信小程序 '2.10.0'起支持全局生效，需在 app.vue 中调用。
        family: config.customIcon.family,
        source: 'url("' + config.customIcon.url + '")',
        success() {
        },
        fail() {
        }
      });
    }
    return true;
  };
  const fontUtil = {
    params,
    isLoaded,
    loadFont
  };
  const _sfc_main$q = {
    name: "u-icon",
    beforeCreate() {
    },
    mounted() {
      if (!fontUtil.isLoaded()) {
        fontUtil.loadFont();
      }
    },
    data() {
      return {};
    },
    emits: ["click"],
    mixins: [mpMixin, mixin, props$3],
    computed: {
      uClasses() {
        let classes = [];
        classes.push(this.customPrefix + "-" + this.name);
        if (this.customPrefix == "uicon") {
          classes.push("u-iconfont");
        } else {
          classes.push(this.customPrefix);
        }
        if (this.color && config.type.includes(this.color))
          classes.push("u-icon__icon--" + this.color);
        return classes;
      },
      iconStyle() {
        let style = {};
        style = {
          fontSize: addUnit(this.size),
          lineHeight: addUnit(this.size),
          fontWeight: this.bold ? "bold" : "normal",
          // 某些特殊情况需要设置一个到顶部的距离，才能更好的垂直居中
          top: addUnit(this.top)
        };
        if (this.customPrefix !== "uicon") {
          style.fontFamily = this.customPrefix;
        }
        if (this.color && !config.type.includes(this.color))
          style.color = this.color;
        return style;
      },
      // 判断传入的name属性，是否图片路径，只要带有"/"均认为是图片形式
      isImg() {
        return this.name.indexOf("/") !== -1;
      },
      imgStyle() {
        let style = {};
        style.width = this.width ? addUnit(this.width) : addUnit(this.size);
        style.height = this.height ? addUnit(this.height) : addUnit(this.size);
        return style;
      },
      // 通过图标名，查找对应的图标
      icon() {
        if (this.customPrefix !== "uicon") {
          return config.customIcons[this.name] || this.name;
        }
        return icons["uicon-" + this.name] || this.name;
      }
    },
    methods: {
      addStyle,
      addUnit,
      clickHandler(e) {
        this.$emit("click", this.index, e);
        this.stop && this.preventEvent(e);
      }
    }
  };
  function _sfc_render$p(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock(
      "view",
      {
        class: vue.normalizeClass(["u-icon", ["u-icon--" + _ctx.labelPos]]),
        onClick: _cache[0] || (_cache[0] = (...args) => $options.clickHandler && $options.clickHandler(...args))
      },
      [
        $options.isImg ? (vue.openBlock(), vue.createElementBlock("image", {
          key: 0,
          class: "u-icon__img",
          src: _ctx.name,
          mode: _ctx.imgMode,
          style: vue.normalizeStyle([$options.imgStyle, $options.addStyle(_ctx.customStyle)])
        }, null, 12, ["src", "mode"])) : (vue.openBlock(), vue.createElementBlock("text", {
          key: 1,
          class: vue.normalizeClass(["u-icon__icon", $options.uClasses]),
          style: vue.normalizeStyle([$options.iconStyle, $options.addStyle(_ctx.customStyle)]),
          "hover-class": _ctx.hoverClass
        }, vue.toDisplayString($options.icon), 15, ["hover-class"])),
        _ctx.label !== "" ? (vue.openBlock(), vue.createElementBlock(
          "text",
          {
            key: 2,
            class: "u-icon__label",
            style: vue.normalizeStyle({
              color: _ctx.labelColor,
              fontSize: $options.addUnit(_ctx.labelSize),
              marginLeft: _ctx.labelPos == "right" ? $options.addUnit(_ctx.space) : 0,
              marginTop: _ctx.labelPos == "bottom" ? $options.addUnit(_ctx.space) : 0,
              marginRight: _ctx.labelPos == "left" ? $options.addUnit(_ctx.space) : 0,
              marginBottom: _ctx.labelPos == "top" ? $options.addUnit(_ctx.space) : 0
            })
          },
          vue.toDisplayString(_ctx.label),
          5
          /* TEXT, STYLE */
        )) : vue.createCommentVNode("v-if", true)
      ],
      2
      /* CLASS */
    );
  }
  const __easycom_2 = /* @__PURE__ */ _export_sfc(_sfc_main$q, [["render", _sfc_render$p], ["__scopeId", "data-v-1c933a9a"], ["__file", "D:/workZone/APP/frontend/node_modules/uview-plus/components/u-icon/u-icon.vue"]]);
  registerComponentProps({ safeBottom: {} });
  const props$2 = defineMixin({
    props: {}
  });
  const _sfc_main$p = {
    name: "u-safe-bottom",
    mixins: [mpMixin, mixin, props$2],
    data() {
      return {
        safeAreaBottomHeight: 0,
        isNvue: false
      };
    },
    computed: {
      style() {
        const style = {};
        return deepMerge(style, addStyle(this.customStyle));
      }
    },
    mounted() {
    }
  };
  function _sfc_render$o(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock(
      "view",
      {
        class: vue.normalizeClass(["u-safe-bottom", [!$data.isNvue && "u-safe-area-inset-bottom"]]),
        style: vue.normalizeStyle([$options.style])
      },
      null,
      6
      /* CLASS, STYLE */
    );
  }
  const __easycom_3 = /* @__PURE__ */ _export_sfc(_sfc_main$p, [["render", _sfc_render$o], ["__scopeId", "data-v-3ec581de"], ["__file", "D:/workZone/APP/frontend/node_modules/uview-plus/components/u-safe-bottom/u-safe-bottom.vue"]]);
  const PopupDefaultProps = {
    // popup组件
    popup: {
      show: false,
      overlay: true,
      mode: "bottom",
      duration: 300,
      closeable: false,
      overlayStyle: {},
      closeOnClickOverlay: true,
      zIndex: 10075,
      safeAreaInsetBottom: true,
      safeAreaInsetTop: false,
      closeIconPos: "top-right",
      round: "20px",
      zoom: true,
      bgColor: "",
      overlayOpacity: 0.5,
      pageInline: false,
      touchable: false,
      minHeight: "200px",
      maxHeight: "600px"
    }
  };
  const defProps$1 = registerComponentProps(PopupDefaultProps);
  const props$1 = defineMixin({
    props: {
      // 是否展示弹窗
      show: {
        type: Boolean,
        default: () => defProps$1.popup.show
      },
      // 是否显示遮罩
      overlay: {
        type: Boolean,
        default: () => defProps$1.popup.overlay
      },
      // 弹出的方向，可选值为 top bottom right left center
      mode: {
        type: String,
        default: () => defProps$1.popup.mode
      },
      // 动画时长，单位ms
      duration: {
        type: [String, Number],
        default: () => defProps$1.popup.duration
      },
      // 是否显示关闭图标
      closeable: {
        type: Boolean,
        default: () => defProps$1.popup.closeable
      },
      // 自定义遮罩的样式
      overlayStyle: {
        type: [Object, String],
        default: () => defProps$1.popup.overlayStyle
      },
      // 点击遮罩是否关闭弹窗
      closeOnClickOverlay: {
        type: Boolean,
        default: () => defProps$1.popup.closeOnClickOverlay
      },
      // 层级
      zIndex: {
        type: [String, Number],
        default: () => defProps$1.popup.zIndex
      },
      // 是否为iPhoneX留出底部安全距离
      safeAreaInsetBottom: {
        type: Boolean,
        default: () => defProps$1.popup.safeAreaInsetBottom
      },
      // 是否留出顶部安全距离（状态栏高度）
      safeAreaInsetTop: {
        type: Boolean,
        default: () => defProps$1.popup.safeAreaInsetTop
      },
      // 自定义关闭图标位置，top-left为左上角，top-right为右上角，bottom-left为左下角，bottom-right为右下角
      closeIconPos: {
        type: String,
        default: () => defProps$1.popup.closeIconPos
      },
      // 是否显示圆角
      round: {
        type: [Boolean, String, Number],
        default: () => defProps$1.popup.round
      },
      // mode=center，也即中部弹出时，是否使用缩放模式
      zoom: {
        type: Boolean,
        default: () => defProps$1.popup.zoom
      },
      // 弹窗背景色，设置为transparent可去除白色背景
      bgColor: {
        type: String,
        default: () => defProps$1.popup.bgColor
      },
      // 遮罩的透明度，0-1之间
      overlayOpacity: {
        type: [Number, String],
        default: () => defProps$1.popup.overlayOpacity
      },
      // 是否页面内展示
      pageInline: {
        type: Boolean,
        default: () => defProps$1.popup.pageInline
      },
      // 是否页开启手势滑动
      touchable: {
        type: Boolean,
        default: () => defProps$1.popup.touchable
      },
      // 手势滑动最小高度
      minHeight: {
        type: [String],
        default: () => defProps$1.popup.minHeight
      },
      // 手势滑动最大高度
      maxHeight: {
        type: [String],
        default: () => defProps$1.popup.maxHeight
      }
    }
  });
  const _sfc_main$o = {
    name: "u-popup",
    mixins: [mpMixin, mixin, props$1],
    data() {
      return {
        overlayDuration: this.duration + 50,
        // close事件是否已由组件内部的关闭动作发出，避免show变化时重复发出
        closeEmitted: false,
        // 触摸相关数据
        touchStartY: 0,
        touchStartHeight: 0,
        isTouching: false,
        // 当前弹窗高度
        currentHeight: "auto"
      };
    },
    watch: {
      show(newValue, oldValue) {
        if (newValue === true) {
          this.closeEmitted = false;
        } else if (oldValue === true) {
          if (this.closeEmitted) {
            this.closeEmitted = false;
          } else {
            this.$emit("close");
          }
          if (this.pageInline) {
            this.$emit("closed");
          }
        }
      }
    },
    computed: {
      transitionStyle() {
        const style = {
          display: "flex"
        };
        if (!this.pageInline) {
          style.zIndex = this.zIndex;
          style.position = "fixed";
        }
        style[this.mode] = 0;
        if (this.mode === "left") {
          return deepMerge(style, {
            bottom: 0,
            top: 0
          });
        } else if (this.mode === "right") {
          return deepMerge(style, {
            bottom: 0,
            top: 0
          });
        } else if (this.mode === "top") {
          return deepMerge(style, {
            left: 0,
            right: 0
          });
        } else if (this.mode === "bottom") {
          return deepMerge(style, {
            left: 0,
            right: 0
          });
        } else if (this.mode === "center") {
          return deepMerge(style, {
            alignItems: "center",
            "justify-content": "center",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0
          });
        }
      },
      contentStyleWrap() {
        const style = {};
        if (this.mode === "bottom" && this.touchable) {
          if (this.currentHeight !== "auto") {
            style.height = this.currentHeight;
          }
          if (this.maxHeight) {
            style.maxHeight = addUnit(this.maxHeight);
          }
          if (this.minHeight) {
            style.minHeight = addUnit(this.minHeight);
          }
        }
        return style;
      },
      contentStyle() {
        const style = {};
        const {
          safeAreaInsets
        } = getWindowInfo();
        if (this.mode !== "center") {
          style.flex = 1;
        }
        style.backgroundColor = this.bgColor || this.upThemeVar("--up-card-bg-color", this.upThemeIsDark ? "#1c1c1e" : "#ffffff");
        if (this.round) {
          const value = addUnit(this.round);
          if (this.mode === "top") {
            style.borderBottomLeftRadius = value;
            style.borderBottomRightRadius = value;
          } else if (this.mode === "bottom") {
            style.borderTopLeftRadius = value;
            style.borderTopRightRadius = value;
          } else if (this.mode === "center") {
            style.borderRadius = value;
          }
        }
        return deepMerge(style, addStyle(this.customStyle));
      },
      closeIconColor() {
        return this.upThemeVar("--up-content-color", "#606266");
      },
      indicatorStyle() {
        return {
          backgroundColor: this.upThemeVar("--up-light-color", "#c0c4cc")
        };
      },
      position() {
        if (this.mode === "center") {
          return this.zoom ? "fade-zoom" : "fade";
        }
        if (this.mode === "left") {
          return "slide-left";
        }
        if (this.mode === "right") {
          return "slide-right";
        }
        if (this.mode === "bottom") {
          return "slide-up";
        }
        if (this.mode === "top") {
          return "slide-down";
        }
      }
    },
    emits: ["open", "close", "closed", "click", "update:show"],
    methods: {
      // 发出close事件。标记仅在本次更新周期内有效，
      // 用于抑制紧随其后的show变化导致watch重复补发close
      emitClose() {
        this.closeEmitted = true;
        this.$emit("close");
        this.$nextTick(() => {
          this.closeEmitted = false;
        });
      },
      // 点击遮罩
      overlayClick() {
        if (this.closeOnClickOverlay) {
          this.$emit("update:show", false);
          this.emitClose();
        }
      },
      open(e) {
        this.closeEmitted = false;
        this.$emit("update:show", true);
      },
      close(e) {
        this.$emit("update:show", false);
        this.emitClose();
      },
      afterEnter() {
        this.$emit("open");
      },
      // 离场动画结束，弹窗已真正消失
      afterLeave() {
        this.$emit("closed");
      },
      clickHandler() {
        if (this.mode === "center") {
          this.overlayClick();
        }
        this.$emit("click");
      },
      // 触摸开始
      onTouchStart(e) {
        if (!this.touchable || this.mode !== "bottom")
          return;
        this.isTouching = true;
        this.touchStartY = e.touches[0].clientY;
        this.touchStartHeight = this.$el.querySelector(".u-popup__content—transition").offsetHeight;
      },
      // 触摸移动
      onTouchMove(e) {
        if (!this.isTouching || !this.touchable || this.mode !== "bottom")
          return;
        const touchY = e.touches[0].clientY;
        const deltaY = touchY - this.touchStartY;
        if (deltaY !== 0) {
          const newHeight = this.touchStartHeight - deltaY;
          const minHeight = parseFloat(addUnit(this.minHeight)) || 200;
          const maxHeight = this.maxHeight ? this.maxHeight.toString().includes("%") ? getWindowInfo().windowHeight * (parseFloat(this.maxHeight) / 100) : parseFloat(addUnit(this.maxHeight)) : getWindowInfo().windowHeight * 0.8;
          if (newHeight >= minHeight && newHeight <= maxHeight) {
            this.currentHeight = newHeight + "px";
          }
        }
        e.preventDefault();
      },
      // 触摸结束
      onTouchEnd(e) {
        if (!this.isTouching || !this.touchable || this.mode !== "bottom")
          return;
        this.isTouching = false;
        const touchY = e.changedTouches[0].clientY;
        const deltaY = touchY - this.touchStartY;
        const velocity = Math.abs(deltaY) / (e.timeStamp - e.changedTouches[0].timestamp);
        if (deltaY > 100 || deltaY > 30 && velocity > 0.5) {
          this.close();
        }
      }
    }
  };
  function _sfc_render$n(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_u_overlay = resolveEasycom(vue.resolveDynamicComponent("u-overlay"), __easycom_0$2);
    const _component_u_status_bar = resolveEasycom(vue.resolveDynamicComponent("u-status-bar"), __easycom_1);
    const _component_up_icon = resolveEasycom(vue.resolveDynamicComponent("up-icon"), __easycom_2);
    const _component_u_safe_bottom = resolveEasycom(vue.resolveDynamicComponent("u-safe-bottom"), __easycom_3);
    const _component_u_transition = resolveEasycom(vue.resolveDynamicComponent("u-transition"), __easycom_4);
    return vue.openBlock(), vue.createElementBlock(
      "view",
      {
        class: vue.normalizeClass(["u-popup", [_ctx.customClass]]),
        style: vue.normalizeStyle({
          width: _ctx.show == false ? "0px" : "",
          height: _ctx.show == false ? "0px" : ""
        })
      },
      [
        vue.createElementVNode("view", { class: "u-popup__trigger" }, [
          vue.renderSlot(_ctx.$slots, "trigger", {}, void 0, true),
          vue.createElementVNode("view", {
            onClick: _cache[0] || (_cache[0] = (...args) => $options.open && $options.open(...args)),
            class: "u-popup__trigger__cover"
          })
        ]),
        _ctx.overlay ? (vue.openBlock(), vue.createBlock(_component_u_overlay, {
          key: 0,
          show: _ctx.show && _ctx.pageInline == false,
          onClick: $options.overlayClick,
          zIndex: _ctx.zIndex,
          duration: $data.overlayDuration,
          customStyle: _ctx.overlayStyle,
          opacity: _ctx.overlayOpacity
        }, null, 8, ["show", "onClick", "zIndex", "duration", "customStyle", "opacity"])) : vue.createCommentVNode("v-if", true),
        vue.createVNode(_component_u_transition, {
          class: "u-popup__content—transition",
          style: vue.normalizeStyle($options.contentStyleWrap),
          show: _ctx.pageInline ? true : _ctx.show,
          customStyle: $options.transitionStyle,
          mode: _ctx.pageInline ? "none" : $options.position,
          duration: _ctx.duration,
          onAfterEnter: $options.afterEnter,
          onAfterLeave: $options.afterLeave,
          onClick: $options.clickHandler
        }, {
          default: vue.withCtx(() => [
            vue.createElementVNode(
              "view",
              {
                class: "u-popup__content",
                style: vue.normalizeStyle([$options.contentStyle]),
                onClick: _cache[6] || (_cache[6] = vue.withModifiers((...args) => _ctx.noop && _ctx.noop(...args), ["stop"])),
                onTouchmove: _cache[7] || (_cache[7] = vue.withModifiers((...args) => _ctx.noop && _ctx.noop(...args), ["stop", "prevent"]))
              },
              [
                _ctx.safeAreaInsetTop ? (vue.openBlock(), vue.createBlock(_component_u_status_bar, { key: 0 })) : vue.createCommentVNode("v-if", true),
                _ctx.touchable && _ctx.mode === "bottom" ? (vue.openBlock(), vue.createElementBlock(
                  "view",
                  {
                    key: 1,
                    class: "u-popup__content__touch-area",
                    onTouchstart: _cache[1] || (_cache[1] = (...args) => $options.onTouchStart && $options.onTouchStart(...args)),
                    onTouchmove: _cache[2] || (_cache[2] = (...args) => $options.onTouchMove && $options.onTouchMove(...args)),
                    onTouchend: _cache[3] || (_cache[3] = (...args) => $options.onTouchEnd && $options.onTouchEnd(...args)),
                    onTouchcancel: _cache[4] || (_cache[4] = (...args) => $options.onTouchEnd && $options.onTouchEnd(...args))
                  },
                  [
                    vue.createElementVNode(
                      "view",
                      {
                        class: "u-popup__content__indicator",
                        style: vue.normalizeStyle($options.indicatorStyle)
                      },
                      null,
                      4
                      /* STYLE */
                    )
                  ],
                  32
                  /* NEED_HYDRATION */
                )) : vue.createCommentVNode("v-if", true),
                vue.renderSlot(_ctx.$slots, "default", {}, void 0, true),
                _ctx.closeable ? (vue.openBlock(), vue.createElementBlock(
                  "view",
                  {
                    key: 2,
                    onClick: _cache[5] || (_cache[5] = vue.withModifiers((...args) => $options.close && $options.close(...args), ["stop"])),
                    class: vue.normalizeClass(["u-popup__content__close", ["u-popup__content__close--" + _ctx.closeIconPos]]),
                    "hover-class": "u-popup__content__close--hover",
                    "hover-stay-time": "150"
                  },
                  [
                    vue.createVNode(_component_up_icon, {
                      name: "close",
                      color: $options.closeIconColor,
                      size: "18",
                      bold: ""
                    }, null, 8, ["color"])
                  ],
                  2
                  /* CLASS */
                )) : vue.createCommentVNode("v-if", true),
                _ctx.safeAreaInsetBottom ? (vue.openBlock(), vue.createBlock(_component_u_safe_bottom, { key: 3 })) : vue.createCommentVNode("v-if", true)
              ],
              36
              /* STYLE, NEED_HYDRATION */
            ),
            vue.renderSlot(_ctx.$slots, "bottom", {}, void 0, true)
          ]),
          _: 3
          /* FORWARDED */
        }, 8, ["style", "show", "customStyle", "mode", "duration", "onAfterEnter", "onAfterLeave", "onClick"])
      ],
      6
      /* CLASS, STYLE */
    );
  }
  const __easycom_0$1 = /* @__PURE__ */ _export_sfc(_sfc_main$o, [["render", _sfc_render$n], ["__scopeId", "data-v-74921bef"], ["__file", "D:/workZone/APP/frontend/node_modules/uview-plus/components/u-popup/u-popup.vue"]]);
  const _sfc_main$n = {
    __name: "JdIcon",
    props: {
      name: { type: String, default: "dot" },
      size: { type: [Number, String], default: 24 },
      color: { type: String, default: "#171210" },
      stroke: { type: [Number, String], default: 1.7 }
    },
    setup(__props, { expose: __expose }) {
      __expose();
      const props2 = __props;
      const PATHS = {
        sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
        list: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
        clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
        users: '<path d="M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20"/><circle cx="9.5" cy="7" r="3.5"/><path d="M22 20v-1.5a4 4 0 0 0-3-3.87M17 4.13a4 4 0 0 1 0 5.74"/>',
        me: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6"/>',
        bell: '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
        plus: '<path d="M12 5v14M5 12h14"/>',
        home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
        chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
        cal: '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M8 3v4M16 3v4M3 10h18"/>',
        gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
        check: '<path d="M4 12.5 9 17.5 20 6.5"/>',
        camera: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l2-3h6l2 3h3a2 2 0 0 1 2 2z"/><circle cx="12" cy="13.5" r="4"/>',
        mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4"/>',
        doc: '<path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z"/><path d="M14 2v5h5M9 13h6M9 17h4"/>',
        shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M8.8 12l2.2 2.2 4.2-4.2"/>',
        down: '<path d="M12 3v14M6 12l6 6 6-6M4 21h16"/>',
        "chevron-left": '<path d="M15 19l-7-7 7-7"/>',
        "chevron-right": '<path d="M9 5l7 7-7 7"/>',
        "chevron-down": '<path d="M6 9l6 6 6-6"/>',
        close: '<path d="M6 6l12 12M18 6L6 18"/>',
        refresh: '<path d="M21 12a9 9 0 1 1-3-6.7M21 3v6h-6"/>',
        filter: '<path d="M3 5h18M7 12h10M10 19h4"/>',
        image: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="8.5" cy="9.5" r="1.8"/><path d="M21 16l-5-5-9 9"/>',
        alert: '<path d="M12 3l9 17H3z"/><path d="M12 9v5M12 17.5h.01"/>',
        lock: '<rect x="4" y="10" width="16" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 1 1 8 0v3"/>',
        edit: '<path d="M4 20h4l10-10a2.8 2.8 0 0 0-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
        phone: '<path d="M6 3h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 4 5a2 2 0 0 1 2-2z"/>',
        send: '<path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/>',
        star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
        wallet: '<rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 10h18M16 14h2"/>',
        heart: '<path d="M12 20s-7-4.5-7-9.5A4 4 0 0 1 12 7a4 4 0 0 1 7 3.5C19 15.5 12 20 12 20z"/>',
        phonecheck: '<path d="M6 3h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 4 5a2 2 0 0 1 2-2z"/>',
        dot: '<circle cx="12" cy="12" r="3"/>',
        lamp: '<path d="M12 3a6 6 0 0 0-3.6 10.8c.5.4.9 1 .9 1.6v.6h5.4v-.6c0-.6.4-1.2.9-1.6A6 6 0 0 0 12 3z"/><path d="M9.6 18.5h4.8M10.6 21h2.8"/>'
      };
      const src = vue.computed(() => {
        const body = PATHS[props2.name] || PATHS.dot;
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${props2.size}" height="${props2.size}" viewBox="0 0 24 24" fill="none" stroke="${props2.color}" stroke-width="${props2.stroke}" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
        return "data:image/svg+xml," + encodeURIComponent(svg);
      });
      const __returned__ = { props: props2, PATHS, src, computed: vue.computed };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$m(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("image", {
      class: "jd-icon",
      src: $setup.src,
      style: vue.normalizeStyle({ width: $props.size + "px", height: $props.size + "px" })
    }, null, 12, ["src"]);
  }
  const JdIcon = /* @__PURE__ */ _export_sfc(_sfc_main$n, [["render", _sfc_render$m], ["__scopeId", "data-v-b531e468"], ["__file", "D:/workZone/APP/frontend/src/components/JdIcon.vue"]]);
  const _sfc_main$m = {
    __name: "JdAvatar",
    props: {
      text: { type: String, default: "我" },
      color: { type: String, default: "owner" },
      size: { type: String, default: "md" }
    },
    setup(__props, { expose: __expose }) {
      __expose();
      const props2 = __props;
      const sizeClass = vue.computed(() => props2.size === "md" ? "" : props2.size);
      const __returned__ = { props: props2, sizeClass, computed: vue.computed };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$l(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock(
      "view",
      {
        class: vue.normalizeClass(["av", [$props.color, $setup.sizeClass]])
      },
      vue.toDisplayString($props.text),
      3
      /* TEXT, CLASS */
    );
  }
  const JdAvatar = /* @__PURE__ */ _export_sfc(_sfc_main$m, [["render", _sfc_render$l], ["__scopeId", "data-v-a6b2f3b3"], ["__file", "D:/workZone/APP/frontend/src/components/JdAvatar.vue"]]);
  const TOKEN_KEY = "jd_token";
  const SESSION_KEY = "jd_session";
  function readSession() {
    try {
      const raw = uni.getStorageSync(SESSION_KEY);
      return raw ? typeof raw === "string" ? JSON.parse(raw) : raw : null;
    } catch (e) {
      return null;
    }
  }
  const cached = readSession() || {};
  const state = vue.reactive({
    token: uni.getStorageSync(TOKEN_KEY) || "",
    user: cached.user || null,
    family: cached.family || null,
    member: cached.member || null,
    members: cached.members || [],
    elder: cached.elder || null,
    preferences: cached.preferences || { careMode: "standard", fontScale: 1, biometric: true },
    greeting: "",
    dateLabel: "",
    ready: false
  });
  function useSession() {
    return state;
  }
  function setSession(payload) {
    if (!payload)
      return;
    if (payload.token) {
      state.token = payload.token;
      uni.setStorageSync(TOKEN_KEY, payload.token);
    }
    if (payload.user)
      state.user = payload.user;
    if (payload.family)
      state.family = payload.family;
    if (payload.member)
      state.member = payload.member;
    if (payload.members)
      state.members = payload.members;
    if (payload.elder)
      state.elder = payload.elder;
    if (payload.preferences)
      state.preferences = payload.preferences;
    if (payload.greeting)
      state.greeting = payload.greeting;
    if (payload.dateLabel)
      state.dateLabel = payload.dateLabel;
    state.ready = true;
    persist();
  }
  function patchSession(patch) {
    Object.assign(state, patch);
    persist();
  }
  function persist() {
    try {
      uni.setStorageSync(
        SESSION_KEY,
        JSON.stringify({
          user: state.user,
          family: state.family,
          member: state.member,
          members: state.members,
          elder: state.elder,
          preferences: state.preferences
        })
      );
    } catch (e) {
    }
  }
  function clearSession() {
    state.token = "";
    state.user = null;
    state.family = null;
    state.member = null;
    state.members = [];
    state.elder = null;
    state.ready = false;
    uni.removeStorageSync(TOKEN_KEY);
    uni.removeStorageSync(SESSION_KEY);
  }
  function isOwner() {
    return state.member && state.member.role === "owner";
  }
  function isElder() {
    return state.member && state.member.role === "elder";
  }
  function go(url2, options = {}) {
    if (options.reLaunch) {
      uni.reLaunch({ url: url2 });
    } else if (options.redirect) {
      uni.redirectTo({ url: url2 });
    } else {
      uni.navigateTo({ url: url2 });
    }
  }
  function back(fallback = "/pages/home/home") {
    const pages2 = getCurrentPages();
    if (pages2 && pages2.length > 1) {
      uni.navigateBack();
    } else {
      uni.reLaunch({ url: fallback });
    }
  }
  function requireLogin() {
    if (!state.token) {
      uni.reLaunch({ url: "/pages/launch/launch" });
      return false;
    }
    return true;
  }
  const TABS = [
    { key: "home", label: "首页", icon: "home", path: "/pages/home/home" },
    { key: "board", label: "看板", icon: "cal", path: "/pages/board/board" },
    { key: "timeline", label: "流水", icon: "clock", path: "/pages/timeline/timeline" },
    { key: "profile", label: "档案", icon: "doc", path: "/pages/profile/profile" },
    { key: "me", label: "我的", icon: "me", path: "/pages/settings/settings" }
  ];
  const session = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
    __proto__: null,
    TABS,
    back,
    clearSession,
    go,
    isElder,
    isOwner,
    patchSession,
    requireLogin,
    setSession,
    state,
    useSession
  }, Symbol.toStringTag, { value: "Module" }));
  var define_import_meta_env_default = { VITE_CJS_IGNORE_WARNING: "true", VITE_ROOT_DIR: "D:\\workZone\\APP\\frontend", VITE_USER_NODE_ENV: "development", BASE_URL: "/", MODE: "development", DEV: true, PROD: false, SSR: false };
  const RAW_BASE = define_import_meta_env_default && define_import_meta_env_default.VITE_API_BASE || "";
  const BASE_URL = String(RAW_BASE).replace(/\/+$/, "");
  const pending = /* @__PURE__ */ new Map();
  let redirecting = false;
  function assetUrl(url2) {
    if (!url2)
      return "";
    if (/^(?:[a-z]+:)?\/\//i.test(url2) || url2.startsWith("data:") || url2.startsWith("blob:"))
      return url2;
    const path = url2.startsWith("/") ? url2 : `/${url2}`;
    return BASE_URL + path;
  }
  function fullUrl(url2) {
    if (!url2)
      return BASE_URL;
    if (/^https?:\/\//i.test(url2))
      return url2;
    return BASE_URL + (url2.startsWith("/") ? url2 : `/${url2}`);
  }
  function toast(msg, silent) {
    if (silent || !msg)
      return;
    uni.showToast({ title: msg, icon: "none", duration: 2400 });
  }
  function redirectToLaunch() {
    if (redirecting)
      return;
    redirecting = true;
    uni.reLaunch({
      url: "/pages/launch/launch",
      complete: () => {
        redirecting = false;
      }
    });
  }
  function errorMessage(body, statusCode, fallback) {
    if (body && typeof body === "object") {
      const msg = body.msg || body.detail || body.message;
      if (typeof msg === "string" && msg)
        return msg;
    }
    if (typeof body === "string" && body && body.length < 200 && !body.startsWith("<"))
      return body;
    return fallback || `请求失败（${statusCode}）`;
  }
  function request(options) {
    const {
      url: url2,
      method = "GET",
      data,
      auth = true,
      silent = false,
      timeout: timeout2 = 2e4,
      withMessage = false,
      dedupe = method === "GET"
    } = options;
    const session2 = useSession();
    const header = { "Content-Type": "application/json" };
    if (auth && session2.token) {
      header.Authorization = `Bearer ${session2.token}`;
    }
    const key = `${method} ${url2} ${auth ? session2.token || "" : "public"} ${data ? JSON.stringify(data) : ""}`;
    if (dedupe && pending.has(key))
      return pending.get(key);
    const task = new Promise((resolve, reject) => {
      uni.request({
        url: fullUrl(url2),
        method,
        data,
        header,
        timeout: timeout2,
        success: (res) => {
          const body = res.data;
          const okCode = res.statusCode >= 200 && res.statusCode < 300;
          if (res.statusCode === 401) {
            const msg = errorMessage(body, 401, "登录已失效，请重新解锁");
            if (auth) {
              clearSession();
              redirectToLaunch();
            } else {
              toast(msg, silent);
            }
            reject(new Error(msg));
            return;
          }
          if (!okCode || !body || body.code !== 0) {
            const msg = errorMessage(body, res.statusCode);
            toast(msg, silent);
            reject(new Error(msg));
            return;
          }
          resolve(withMessage ? { data: body.data, msg: body.msg || "" } : body.data);
        },
        fail: (err) => {
          const raw = err && err.errMsg ? err.errMsg : "";
          const msg = /timeout/i.test(raw) ? "请求超时，请稍后重试" : "网络不可用，请检查连接后重试";
          toast(msg, silent);
          reject(new Error(raw || msg));
        }
      });
    });
    if (dedupe) {
      pending.set(key, task);
      const cleanup = () => pending.delete(key);
      task.then(cleanup, cleanup);
    }
    return task;
  }
  function upload(options) {
    const {
      url: url2 = "/api/upload",
      filePath,
      name = "file",
      formData,
      auth = true,
      silent = false
    } = options;
    const session2 = useSession();
    const header = {};
    if (auth && session2.token)
      header.Authorization = `Bearer ${session2.token}`;
    return new Promise((resolve, reject) => {
      uni.uploadFile({
        url: fullUrl(url2),
        filePath,
        name,
        formData,
        header,
        success: (res) => {
          let body = res.data;
          if (typeof body === "string") {
            try {
              body = JSON.parse(body);
            } catch (e) {
              body = null;
            }
          }
          if (res.statusCode === 401) {
            const msg = errorMessage(body, 401, "登录已失效，请重新解锁");
            if (auth) {
              clearSession();
              redirectToLaunch();
            }
            reject(new Error(msg));
            return;
          }
          if (res.statusCode < 200 || res.statusCode >= 300 || !body || body.code !== 0) {
            const msg = errorMessage(body, res.statusCode, "上传失败，请重试");
            toast(msg, silent);
            reject(new Error(msg));
            return;
          }
          resolve(body.data);
        },
        fail: () => {
          toast("上传失败，请检查网络后重试", silent);
          reject(new Error("upload failed"));
        }
      });
    });
  }
  const http = {
    get: (url2, params2, opts = {}) => {
      let qs = "";
      if (params2) {
        qs = Object.keys(params2).filter((k) => params2[k] !== void 0 && params2[k] !== null && params2[k] !== "").map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params2[k])}`).join("&");
      }
      return request({ url: qs ? `${url2}?${qs}` : url2, method: "GET", ...opts });
    },
    post: (url2, data, opts = {}) => request({ url: url2, method: "POST", data, ...opts }),
    patch: (url2, data, opts = {}) => request({ url: url2, method: "PATCH", data, ...opts }),
    put: (url2, data, opts = {}) => request({ url: url2, method: "PUT", data, ...opts })
  };
  const authApi = {
    login: (data) => http.post("/api/auth/login", data, { auth: false }),
    face: (data = {}) => http.post("/api/auth/face", data, { auth: false }),
    register: (data) => http.post("/api/auth/register", data, { auth: false }),
    me: () => http.get("/api/auth/me"),
    logout: () => http.post("/api/auth/logout", {})
  };
  const homeApi = {
    overview: () => http.get("/api/home"),
    widget: () => http.get("/api/home/widget")
  };
  const taskApi = {
    meta: () => http.get("/api/tasks/meta"),
    list: (params2) => http.get("/api/tasks", params2),
    detail: (id) => http.get(`/api/tasks/${id}`),
    create: (data) => http.post("/api/tasks", data, { withMessage: true }),
    claim: (id) => http.post(`/api/tasks/${id}/claim`, {}),
    start: (id) => http.post(`/api/tasks/${id}/start`, {}),
    complete: (id, data) => http.post(`/api/tasks/${id}/complete`, data, { withMessage: true }),
    confirm: (id, data = {}) => http.post(`/api/tasks/${id}/confirm`, data, { withMessage: true }),
    remind: (id) => http.post(`/api/tasks/${id}/remind`, {}),
    reassign: (id, data) => http.post(`/api/tasks/${id}/reassign`, data),
    cancel: (id, data) => http.post(`/api/tasks/${id}/cancel`, data),
    skip: (id, data = {}) => http.post(`/api/tasks/${id}/skip`, data),
    question: (id, data) => http.post(`/api/tasks/${id}/question`, data)
  };
  const scheduleApi = {
    get: (weekStart) => http.get("/api/schedule", { weekStart }),
    toggle: (data) => http.post("/api/schedule/slot", data),
    auto: () => http.post("/api/schedule/auto", {}),
    generate: (weekStart) => http.post("/api/schedule/generate-tasks", { weekStart })
  };
  const timelineApi = {
    list: (params2) => http.get("/api/timeline", params2)
  };
  const elderApi = {
    detail: (id) => http.get(`/api/elders/${id}`),
    update: (id, data) => http.patch(`/api/elders/${id}`, data),
    accessLogs: (id) => http.get(`/api/elders/${id}/access-logs`),
    recordAccess: (id, data) => http.post(`/api/elders/${id}/access-log`, data)
  };
  const medApi = {
    list: (elderId) => http.get(`/api/elders/${elderId}/meds`),
    create: (elderId, data) => http.post(`/api/elders/${elderId}/meds`, data),
    take: (id) => http.post(`/api/meds/${id}/take`, {}, { withMessage: true }),
    refill: (id) => http.post(`/api/meds/${id}/refill-task`, {}, { withMessage: true }),
    stop: (id) => http.post(`/api/meds/${id}/stop`, {}, { withMessage: true }),
    createFollowUp: (elderId, data) => http.post(`/api/elders/${elderId}/follow-ups`, data, { withMessage: true }),
    updateFollowUp: (id, data) => http.patch(`/api/follow-ups/${id}`, data, { withMessage: true }),
    generateFollowUpTask: (id) => http.post(`/api/follow-ups/${id}/generate-task`, {}, { withMessage: true })
  };
  const reportApi = {
    list: (elderId) => http.get("/api/reports", { elderId }),
    detail: (id) => http.get(`/api/reports/${id}`),
    analyze: (data) => http.post("/api/reports/analyze", data),
    askList: (id) => http.post(`/api/reports/${id}/ask-list`, {}, { withMessage: true }),
    archive: (id) => http.post(`/api/reports/${id}/archive`, {}, { withMessage: true })
  };
  const settingApi = {
    get: () => http.get("/api/settings"),
    notifications: (data) => http.patch("/api/settings/notifications", data),
    widget: (data) => http.patch("/api/settings/widget", data),
    preferences: (data) => http.patch("/api/settings/preferences", data),
    logs: () => http.get("/api/settings/notification-logs"),
    test: () => http.post("/api/settings/test-notification", {})
  };
  const vipApi = {
    get: () => http.get("/api/membership"),
    order: (data) => http.post("/api/membership/orders", data),
    pay: (outTradeNo) => http.post(`/api/membership/orders/${outTradeNo}/pay`, {}),
    refund: () => http.post("/api/membership/refund", {})
  };
  const exportApi = {
    preview: (params2) => http.get("/api/export/preview", params2),
    create: (data) => http.post("/api/export", data),
    records: () => http.get("/api/export/records")
  };
  const _sfc_main$l = {
    __name: "launch",
    setup(__props, { expose: __expose }) {
      __expose();
      const session2 = useSession();
      const unlocking = vue.ref(false);
      const showAccounts = vue.ref(false);
      const showLogin = vue.ref(false);
      const syncLabel = vue.ref("尚未同步");
      const cachedTasks = vue.ref(0);
      const user = vue.computed(() => session2.user);
      const family = vue.computed(() => session2.family);
      const member = vue.computed(() => session2.member);
      const unlockLabel = vue.computed(() => {
        if (unlocking.value)
          return "正在验证面容…";
        return session2.token ? "继续进入家灯" : "用面容解锁";
      });
      const form = vue.ref({ username: "13800000001", password: "123456" });
      const accounts = [
        { username: "13800000001", name: "王芳", role: "李家 · 主理子女", text: "芳", color: "owner" },
        { username: "13800000002", name: "王丽", role: "李家 · 妹妹", text: "丽", color: "sis" },
        { username: "13800000003", name: "王建国", role: "李家 · 爸爸（关怀版）", text: "爸", color: "dad" },
        { username: "13800000004", name: "李秀兰", role: "李家 · 妈妈", text: "妈", color: "mom" }
      ];
      function applySync(data) {
        if (data && data.sync) {
          if (data.sync.lastSyncAt) {
            syncLabel.value = data.sync.lastSyncAt.slice(11, 16) || "今天";
          }
          if (typeof data.sync.cachedTasks === "number") {
            cachedTasks.value = data.sync.cachedTasks;
          }
        }
      }
      vue.onMounted(() => {
        if (session2.token) {
          authApi.me().then((data) => {
            setSession(data);
            applySync(data);
          }).catch(() => {
          });
        }
      });
      async function unlock() {
        if (unlocking.value)
          return;
        unlocking.value = true;
        try {
          const data = await authApi.face();
          setSession(data);
          applySync(data);
          setTimeout(() => {
            unlocking.value = false;
            uni.reLaunch({ url: "/pages/home/home" });
          }, 620);
        } catch (e) {
          unlocking.value = false;
        }
      }
      async function loginByPassword() {
        if (!form.value.username || !form.value.password) {
          uni.showToast({ title: "请填写手机号和密码", icon: "none" });
          return;
        }
        unlocking.value = true;
        try {
          const data = await authApi.login(form.value);
          setSession(data);
          applySync(data);
          showLogin.value = false;
          uni.reLaunch({ url: "/pages/home/home" });
        } catch (e) {
        } finally {
          unlocking.value = false;
        }
      }
      async function loginAs(username) {
        unlocking.value = true;
        try {
          const data = await authApi.face({ username });
          setSession(data);
          applySync(data);
          showAccounts.value = false;
          uni.reLaunch({ url: "/pages/home/home" });
        } catch (e) {
        } finally {
          unlocking.value = false;
        }
      }
      const __returned__ = { session: session2, unlocking, showAccounts, showLogin, syncLabel, cachedTasks, user, family, member, unlockLabel, form, accounts, applySync, unlock, loginByPassword, loginAs, ref: vue.ref, computed: vue.computed, onMounted: vue.onMounted, JdIcon, JdAvatar, get authApi() {
        return authApi;
      }, get useSession() {
        return useSession;
      }, get setSession() {
        return setSession;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$k(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_u_popup = resolveEasycom(vue.resolveDynamicComponent("u-popup"), __easycom_0$1);
    return vue.openBlock(), vue.createElementBlock("view", { class: "jd-page launch" }, [
      vue.createElementVNode("view", { class: "hero" }, [
        vue.createElementVNode("view", { class: "logo" }, [
          vue.createVNode($setup["JdIcon"], {
            name: "lamp",
            size: 52,
            color: "#FFFFFF",
            stroke: 1.4
          })
        ]),
        vue.createElementVNode("text", { class: "brand t28 b mt20" }, "家灯"),
        vue.createElementVNode("text", { class: "t12 c3 mt6" }, "离线也能看，随时有记录")
      ]),
      vue.createElementVNode("view", { class: "wrap" }, [
        vue.createElementVNode("view", { class: "card" }, [
          vue.createElementVNode("view", { class: "row g12" }, [
            vue.createVNode($setup["JdAvatar"], {
              text: $setup.user ? $setup.user.avatarText : "芳",
              color: $setup.user ? $setup.user.avatarColor : "owner"
            }, null, 8, ["text", "color"]),
            vue.createElementVNode("view", { class: "f1" }, [
              vue.createElementVNode(
                "text",
                { class: "t15 sb" },
                vue.toDisplayString($setup.user ? $setup.user.name : "王芳"),
                1
                /* TEXT */
              ),
              vue.createElementVNode(
                "view",
                { class: "t11 c3 mt2" },
                vue.toDisplayString($setup.family ? $setup.family.name : "李家") + " · " + vue.toDisplayString($setup.member ? $setup.member.relation : "主理子女"),
                1
                /* TEXT */
              )
            ]),
            vue.createElementVNode("view", { class: "tag" }, "Face ID")
          ]),
          vue.createElementVNode("button", {
            class: "btn btn-primary mt16",
            disabled: $setup.unlocking,
            onClick: $setup.unlock
          }, [
            vue.createVNode($setup["JdIcon"], {
              name: "shield",
              size: 18,
              color: "#FFFFFF"
            }),
            vue.createElementVNode(
              "text",
              null,
              vue.toDisplayString($setup.unlockLabel),
              1
              /* TEXT */
            )
          ], 8, ["disabled"]),
          vue.createElementVNode("view", { class: "t11 c3 tc mt10" }, "健康档案已加密，解锁后才能查看")
        ]),
        vue.createElementVNode("view", { class: "card flat mt12 sync-card" }, [
          vue.createElementVNode("view", { class: "between" }, [
            vue.createElementVNode("text", { class: "t12 c2" }, "上次同步"),
            vue.createElementVNode(
              "text",
              { class: "t12 sb" },
              vue.toDisplayString($setup.syncLabel),
              1
              /* TEXT */
            )
          ]),
          vue.createElementVNode("view", { class: "between mt8" }, [
            vue.createElementVNode("text", { class: "t12 c2" }, "离线缓存"),
            vue.createElementVNode(
              "text",
              { class: "t12 sb cok" },
              vue.toDisplayString($setup.cachedTasks ? `可用 · ${$setup.cachedTasks} 条任务` : "登录后可离线查看"),
              1
              /* TEXT */
            )
          ])
        ]),
        vue.createElementVNode("view", { class: "row center g8 mt18" }, [
          vue.createElementVNode("text", {
            class: "t11 c3",
            onClick: _cache[0] || (_cache[0] = ($event) => $setup.showAccounts = true)
          }, "切换演示身份"),
          vue.createElementVNode("text", { class: "t11 c4" }, "·"),
          vue.createElementVNode("text", {
            class: "t11 c3",
            onClick: _cache[1] || (_cache[1] = ($event) => $setup.showLogin = true)
          }, "手机号登录")
        ]),
        vue.createElementVNode("view", { class: "row center g6 mt20 t11 c4" }, "v1.1.0 · 给经常安排事情的人")
      ]),
      $setup.unlocking ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 0,
        class: "scan-mask"
      }, [
        vue.createElementVNode("view", { class: "scan-frame" }, [
          vue.createElementVNode("view", { class: "scan-line" }),
          vue.createVNode($setup["JdIcon"], {
            name: "shield",
            size: 34,
            color: "#FFC48A"
          }),
          vue.createElementVNode("text", {
            class: "t13 mt10",
            style: { "color": "#ffd9b8" }
          }, "正在确认是你本人")
        ])
      ])) : vue.createCommentVNode("v-if", true),
      vue.createVNode(_component_u_popup, {
        show: $setup.showAccounts,
        "onUpdate:show": _cache[2] || (_cache[2] = ($event) => $setup.showAccounts = $event),
        mode: "bottom",
        round: "20",
        safeAreaInsetBottom: true
      }, {
        default: vue.withCtx(() => [
          vue.createElementVNode("view", { class: "pop" }, [
            vue.createElementVNode("view", { class: "pop-title" }, "演示身份"),
            vue.createElementVNode("view", { class: "t11 c3 mb10" }, "同一份家庭数据，用不同成员视角看同一件事。"),
            vue.createElementVNode("view", { class: "list" }, [
              (vue.openBlock(), vue.createElementBlock(
                vue.Fragment,
                null,
                vue.renderList($setup.accounts, (acc) => {
                  return vue.createElementVNode("view", {
                    key: acc.username,
                    class: "li",
                    onClick: ($event) => $setup.loginAs(acc.username)
                  }, [
                    vue.createVNode($setup["JdAvatar"], {
                      text: acc.text,
                      color: acc.color,
                      size: "sm"
                    }, null, 8, ["text", "color"]),
                    vue.createElementVNode("view", { class: "f1" }, [
                      vue.createElementVNode(
                        "text",
                        { class: "lb" },
                        vue.toDisplayString(acc.name),
                        1
                        /* TEXT */
                      ),
                      vue.createElementVNode(
                        "view",
                        { class: "t11 c3 mt2" },
                        vue.toDisplayString(acc.role),
                        1
                        /* TEXT */
                      )
                    ]),
                    vue.createElementVNode(
                      "text",
                      { class: "t11 cbrand" },
                      vue.toDisplayString(acc.username),
                      1
                      /* TEXT */
                    )
                  ], 8, ["onClick"]);
                }),
                64
                /* STABLE_FRAGMENT */
              ))
            ]),
            vue.createElementVNode("view", { class: "t11 c4 tc mt14" }, "统一密码 123456")
          ])
        ]),
        _: 1
        /* STABLE */
      }, 8, ["show"]),
      vue.createVNode(_component_u_popup, {
        show: $setup.showLogin,
        "onUpdate:show": _cache[5] || (_cache[5] = ($event) => $setup.showLogin = $event),
        mode: "bottom",
        round: "20",
        safeAreaInsetBottom: true
      }, {
        default: vue.withCtx(() => [
          vue.createElementVNode("view", { class: "pop" }, [
            vue.createElementVNode("view", { class: "pop-title" }, "手机号登录"),
            vue.createElementVNode("view", { class: "field mt6" }, [
              vue.createElementVNode("view", { class: "lab" }, "手机号"),
              vue.withDirectives(vue.createElementVNode(
                "input",
                {
                  "onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => $setup.form.username = $event),
                  class: "input",
                  placeholder: "13800000001",
                  "placeholder-class": "ph"
                },
                null,
                512
                /* NEED_PATCH */
              ), [
                [vue.vModelText, $setup.form.username]
              ])
            ]),
            vue.createElementVNode("view", { class: "field mt8" }, [
              vue.createElementVNode("view", { class: "lab" }, "密码"),
              vue.withDirectives(vue.createElementVNode(
                "input",
                {
                  "onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => $setup.form.password = $event),
                  class: "input",
                  password: "",
                  placeholder: "123456",
                  "placeholder-class": "ph"
                },
                null,
                512
                /* NEED_PATCH */
              ), [
                [vue.vModelText, $setup.form.password]
              ])
            ]),
            vue.createElementVNode("button", {
              class: "btn btn-primary mt14",
              disabled: $setup.unlocking,
              onClick: $setup.loginByPassword
            }, "登录", 8, ["disabled"])
          ])
        ]),
        _: 1
        /* STABLE */
      }, 8, ["show"])
    ]);
  }
  const PagesLaunchLaunch = /* @__PURE__ */ _export_sfc(_sfc_main$l, [["render", _sfc_render$k], ["__scopeId", "data-v-31c5669d"], ["__file", "D:/workZone/APP/frontend/src/pages/launch/launch.vue"]]);
  const {
    color
  } = config;
  const LoadingIconDefaultProps = {
    // loading-icon加载中图标组件
    loadingIcon: {
      show: true,
      color: color["u-tips-color"],
      textColor: color["u-tips-color"],
      vertical: false,
      mode: "spinner",
      size: 24,
      textSize: 15,
      text: "",
      timingFunction: "ease-in-out",
      duration: 1200,
      inactiveColor: ""
    }
  };
  const defProps = registerComponentProps(LoadingIconDefaultProps);
  const props = defineMixin({
    props: {
      // 是否显示组件
      show: {
        type: Boolean,
        default: () => defProps.loadingIcon.show
      },
      // 颜色
      color: {
        type: String,
        default: () => defProps.loadingIcon.color
      },
      // 提示文字颜色
      textColor: {
        type: String,
        default: () => defProps.loadingIcon.textColor
      },
      // 文字和图标是否垂直排列
      vertical: {
        type: Boolean,
        default: () => defProps.loadingIcon.vertical
      },
      // 模式选择，circle-圆形，spinner-花朵形，semicircle-半圆形
      mode: {
        type: String,
        default: () => defProps.loadingIcon.mode
      },
      // 图标大小，单位默认px
      size: {
        type: [String, Number],
        default: () => defProps.loadingIcon.size
      },
      // 文字大小
      textSize: {
        type: [String, Number],
        default: () => defProps.loadingIcon.textSize
      },
      // 文字内容
      text: {
        type: [String, Number],
        default: () => defProps.loadingIcon.text
      },
      // 动画模式
      timingFunction: {
        type: String,
        default: () => defProps.loadingIcon.timingFunction
      },
      // 动画执行周期时间
      duration: {
        type: [String, Number],
        default: () => defProps.loadingIcon.duration
      },
      // mode=circle时的暗边颜色
      inactiveColor: {
        type: String,
        default: () => defProps.loadingIcon.inactiveColor
      }
    }
  });
  function colorGradient(startColor = "rgb(0, 0, 0)", endColor = "rgb(255, 255, 255)", step = 10) {
    const startRGB = hexToRgb(startColor, false);
    const startR = startRGB[0];
    const startG = startRGB[1];
    const startB = startRGB[2];
    const endRGB = hexToRgb(endColor, false);
    const endR = endRGB[0];
    const endG = endRGB[1];
    const endB = endRGB[2];
    const sR = (endR - startR) / step;
    const sG = (endG - startG) / step;
    const sB = (endB - startB) / step;
    const colorArr = [];
    for (let i = 0; i < step; i++) {
      let hex = rgbToHex(`rgb(${Math.round(sR * i + startR)},${Math.round(sG * i + startG)},${Math.round(sB * i + startB)})`);
      if (i === 0)
        hex = rgbToHex(startColor);
      if (i === step - 1)
        hex = rgbToHex(endColor);
      colorArr.push(hex);
    }
    return colorArr;
  }
  function hexToRgb(sColor, str = true) {
    const reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/;
    sColor = String(sColor).toLowerCase();
    if (sColor && reg.test(sColor)) {
      if (sColor.length === 4) {
        let sColorNew = "#";
        for (let i = 1; i < 4; i += 1) {
          sColorNew += sColor.slice(i, i + 1).concat(sColor.slice(i, i + 1));
        }
        sColor = sColorNew;
      }
      const sColorChange = [];
      for (let i = 1; i < 7; i += 2) {
        sColorChange.push(parseInt(`0x${sColor.slice(i, i + 2)}`));
      }
      if (!str) {
        return sColorChange;
      }
      return `rgb(${sColorChange[0]},${sColorChange[1]},${sColorChange[2]})`;
    }
    if (/^(rgb|RGB)/.test(sColor)) {
      const arr = sColor.replace(/(?:\(|\)|rgb|RGB)*/g, "").split(",");
      return arr.map((val) => Number(val));
    }
    return sColor;
  }
  function rgbToHex(rgb) {
    const _this = rgb;
    const reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/;
    if (/^(rgb|RGB)/.test(_this)) {
      const aColor = _this.replace(/(?:\(|\)|rgb|RGB)*/g, "").split(",");
      let strHex = "#";
      for (let i = 0; i < aColor.length; i++) {
        let hex = Number(aColor[i]).toString(16);
        hex = String(hex).length == 1 ? `${0}${hex}` : hex;
        if (hex === "0") {
          hex += hex;
        }
        strHex += hex;
      }
      if (strHex.length !== 7) {
        strHex = _this;
      }
      return strHex;
    }
    if (reg.test(_this)) {
      const aNum = _this.replace(/#/, "").split("");
      if (aNum.length === 6) {
        return _this;
      }
      if (aNum.length === 3) {
        let numHex = "#";
        for (let i = 0; i < aNum.length; i += 1) {
          numHex += aNum[i] + aNum[i];
        }
        return numHex;
      }
    } else {
      return _this;
    }
  }
  function colorToRgba(color2, alpha) {
    color2 = rgbToHex(color2);
    const reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/;
    let sColor = String(color2).toLowerCase();
    if (sColor && reg.test(sColor)) {
      if (sColor.length === 4) {
        let sColorNew = "#";
        for (let i = 1; i < 4; i += 1) {
          sColorNew += sColor.slice(i, i + 1).concat(sColor.slice(i, i + 1));
        }
        sColor = sColorNew;
      }
      const sColorChange = [];
      for (let i = 1; i < 7; i += 2) {
        sColorChange.push(parseInt(`0x${sColor.slice(i, i + 2)}`));
      }
      return `rgba(${sColorChange.join(",")},${alpha})`;
    }
    return sColor;
  }
  const colorGradient$1 = {
    colorGradient,
    hexToRgb,
    rgbToHex,
    colorToRgba
  };
  const _sfc_main$k = {
    name: "u-loading-icon",
    mixins: [mpMixin, mixin, props],
    data() {
      return {
        // Array.form可以通过一个伪数组对象创建指定长度的数组
        // https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/from
        array12: Array.from({
          length: 12
        }),
        // 这里需要设置默认值为360，否则在安卓nvue上，会延迟一个duration周期后才执行
        // 在iOS nvue上，则会一开始默认执行两个周期的动画
        aniAngel: 360,
        // 动画旋转角度
        webviewHide: false,
        // 监听webview的状态，如果隐藏了页面，则停止动画，以免性能消耗
        loading: false
        // 是否运行中，针对nvue使用
      };
    },
    computed: {
      // 当为circle类型时，给其另外三边设置一个更轻一些的颜色
      // 之所以需要这么做的原因是，比如父组件传了color为红色，那么需要另外的三个边为浅红色
      // 而不能是固定的某一个其他颜色(因为这个固定的颜色可能浅蓝，导致效果没有那么细腻良好)
      otherBorderColor() {
        const lightColor = colorGradient(this.color, "#ffffff", 100)[80];
        if (this.mode === "circle") {
          return this.inactiveColor ? this.inactiveColor : lightColor;
        } else {
          return "transparent";
        }
      }
    },
    watch: {
      show(n) {
      }
    },
    mounted() {
      this.init();
    },
    methods: {
      addUnit,
      addStyle,
      init() {
        setTimeout(() => {
          this.show && this.addEventListenerToWebview();
        }, 20);
      },
      // 监听webview的显示与隐藏
      addEventListenerToWebview() {
        const pages2 = getCurrentPages();
        const page2 = pages2[pages2.length - 1];
        const currentWebview = page2.$getAppWebview();
        currentWebview.addEventListener("hide", () => {
          this.webviewHide = true;
        });
        currentWebview.addEventListener("show", () => {
          this.webviewHide = false;
        });
      }
    }
  };
  function _sfc_render$j(_ctx, _cache, $props, $setup, $data, $options) {
    return _ctx.show ? (vue.openBlock(), vue.createElementBlock(
      "view",
      {
        key: 0,
        class: vue.normalizeClass(["u-loading-icon", [_ctx.vertical && "u-loading-icon--vertical"]]),
        style: vue.normalizeStyle([$options.addStyle(_ctx.customStyle)])
      },
      [
        !$data.webviewHide ? (vue.openBlock(), vue.createElementBlock(
          "view",
          {
            key: 0,
            class: vue.normalizeClass(["u-loading-icon__spinner", [`u-loading-icon__spinner--${_ctx.mode}`]]),
            ref: "ani",
            style: vue.normalizeStyle({
              color: _ctx.color,
              width: $options.addUnit(_ctx.size),
              height: $options.addUnit(_ctx.size),
              borderTopColor: _ctx.color,
              borderBottomColor: $options.otherBorderColor,
              borderLeftColor: $options.otherBorderColor,
              borderRightColor: $options.otherBorderColor,
              "animation-duration": `${_ctx.duration}ms`,
              "animation-timing-function": _ctx.mode === "semicircle" || _ctx.mode === "circle" ? _ctx.timingFunction : ""
            })
          },
          [
            _ctx.mode === "spinner" ? (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              { key: 0 },
              vue.renderList($data.array12, (item, index2) => {
                return vue.openBlock(), vue.createElementBlock("view", {
                  key: index2,
                  class: "u-loading-icon__dot"
                });
              }),
              128
              /* KEYED_FRAGMENT */
            )) : vue.createCommentVNode("v-if", true)
          ],
          6
          /* CLASS, STYLE */
        )) : vue.createCommentVNode("v-if", true),
        _ctx.text ? (vue.openBlock(), vue.createElementBlock(
          "text",
          {
            key: 1,
            class: "u-loading-icon__text",
            style: vue.normalizeStyle({
              fontSize: $options.addUnit(_ctx.textSize),
              color: _ctx.textColor
            })
          },
          vue.toDisplayString(_ctx.text),
          5
          /* TEXT, STYLE */
        )) : vue.createCommentVNode("v-if", true)
      ],
      6
      /* CLASS, STYLE */
    )) : vue.createCommentVNode("v-if", true);
  }
  const __easycom_0 = /* @__PURE__ */ _export_sfc(_sfc_main$k, [["render", _sfc_render$j], ["__scopeId", "data-v-00752c6d"], ["__file", "D:/workZone/APP/frontend/node_modules/uview-plus/components/u-loading-icon/u-loading-icon.vue"]]);
  const _sfc_main$j = {
    __name: "JdNav",
    props: {
      title: { type: String, default: "" },
      back: { type: Boolean, default: false },
      action: { type: String, default: "" },
      tint: { type: Boolean, default: false },
      fallback: { type: String, default: "/pages/home/home" }
    },
    emits: ["action"],
    setup(__props, { expose: __expose, emit: __emit }) {
      __expose();
      const props2 = __props;
      const emit = __emit;
      function onBack() {
        emit("back");
        back(props2.fallback);
      }
      const __returned__ = { props: props2, emit, onBack, JdIcon, get goBack() {
        return back;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$i(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock(
      "view",
      {
        class: vue.normalizeClass(["jd-nav", { tint: $props.tint }])
      },
      [
        vue.createElementVNode("view", { class: "status-pad" }),
        vue.createElementVNode("view", { class: "bar" }, [
          $props.back ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "nav-back",
            "hover-class": "nav-back-hover",
            onClick: $setup.onBack
          }, [
            vue.createVNode($setup["JdIcon"], {
              name: "chevron-left",
              size: 22,
              color: "#171210"
            })
          ])) : vue.createCommentVNode("v-if", true),
          vue.createElementVNode(
            "text",
            { class: "ttl" },
            vue.toDisplayString($props.title),
            1
            /* TEXT */
          ),
          $props.action ? (vue.openBlock(), vue.createElementBlock(
            "view",
            {
              key: 1,
              class: "act",
              onClick: _cache[0] || (_cache[0] = ($event) => _ctx.$emit("action"))
            },
            vue.toDisplayString($props.action),
            1
            /* TEXT */
          )) : vue.createCommentVNode("v-if", true),
          vue.renderSlot(_ctx.$slots, "right", {}, void 0, true)
        ])
      ],
      2
      /* CLASS */
    );
  }
  const JdNav = /* @__PURE__ */ _export_sfc(_sfc_main$j, [["render", _sfc_render$i], ["__scopeId", "data-v-1630e7dd"], ["__file", "D:/workZone/APP/frontend/src/components/JdNav.vue"]]);
  const _sfc_main$i = {
    __name: "JdTabbar",
    props: {
      active: { type: String, default: "home" },
      badge: { type: Boolean, default: false }
    },
    setup(__props, { expose: __expose }) {
      __expose();
      const tabs = TABS;
      function switchTo(tab) {
        uni.reLaunch({ url: tab.path });
      }
      const __returned__ = { tabs, switchTo, JdIcon, get TABS() {
        return TABS;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$h(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "jd-tabbar" }, [
      (vue.openBlock(true), vue.createElementBlock(
        vue.Fragment,
        null,
        vue.renderList($setup.tabs, (tab) => {
          return vue.openBlock(), vue.createElementBlock("view", {
            key: tab.key,
            class: vue.normalizeClass(["tab", { on: tab.key === $props.active }]),
            onClick: ($event) => $setup.switchTo(tab)
          }, [
            vue.createVNode($setup["JdIcon"], {
              name: tab.icon,
              size: 24,
              color: tab.key === $props.active ? "#C2410C" : "#7A6E63"
            }, null, 8, ["name", "color"]),
            vue.createElementVNode(
              "text",
              { class: "label" },
              vue.toDisplayString(tab.label),
              1
              /* TEXT */
            ),
            tab.key === "board" && $props.badge ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 0,
              class: "dot"
            })) : vue.createCommentVNode("v-if", true)
          ], 10, ["onClick"]);
        }),
        128
        /* KEYED_FRAGMENT */
      ))
    ]);
  }
  const JdTabbar = /* @__PURE__ */ _export_sfc(_sfc_main$i, [["render", _sfc_render$h], ["__scopeId", "data-v-44731023"], ["__file", "D:/workZone/APP/frontend/src/components/JdTabbar.vue"]]);
  const _sfc_main$h = {
    __name: "JdStatus",
    props: {
      label: { type: String, default: "" },
      tone: { type: String, default: "mute" }
    },
    setup(__props, { expose: __expose }) {
      __expose();
      const __returned__ = {};
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$g(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock(
      "view",
      {
        class: vue.normalizeClass(["st", $props.tone])
      },
      [
        vue.createElementVNode("view", { class: "dot" }),
        vue.createElementVNode(
          "text",
          null,
          vue.toDisplayString($props.label),
          1
          /* TEXT */
        )
      ],
      2
      /* CLASS */
    );
  }
  const JdStatus = /* @__PURE__ */ _export_sfc(_sfc_main$h, [["render", _sfc_render$g], ["__file", "D:/workZone/APP/frontend/src/components/JdStatus.vue"]]);
  const _sfc_main$g = {
    __name: "JdRing",
    props: {
      value: { type: Number, default: 0 },
      label: { type: String, default: "" },
      size: { type: Number, default: 84 }
    },
    setup(__props, { expose: __expose }) {
      __expose();
      const props2 = __props;
      const ringStyle = vue.computed(() => {
        const v = Math.max(0, Math.min(100, props2.value));
        return {
          width: props2.size + "px",
          height: props2.size + "px",
          background: `conic-gradient(#EA580C ${v * 3.6}deg, #F6EFE6 0deg)`
        };
      });
      const __returned__ = { props: props2, ringStyle, computed: vue.computed };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$f(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock(
      "view",
      {
        class: "ring",
        style: vue.normalizeStyle($setup.ringStyle)
      },
      [
        vue.createElementVNode("view", { class: "inner" }, [
          vue.createElementVNode(
            "text",
            { class: "val" },
            vue.toDisplayString($props.label),
            1
            /* TEXT */
          )
        ])
      ],
      4
      /* STYLE */
    );
  }
  const JdRing = /* @__PURE__ */ _export_sfc(_sfc_main$g, [["render", _sfc_render$f], ["__scopeId", "data-v-497a632a"], ["__file", "D:/workZone/APP/frontend/src/components/JdRing.vue"]]);
  const _sfc_main$f = {
    __name: "home",
    setup(__props, { expose: __expose }) {
      __expose();
      const session2 = useSession();
      const data = vue.ref(null);
      const loading = vue.ref(true);
      const online = vue.ref(true);
      const isElder2 = vue.computed(() => session2.member && session2.member.role === "elder");
      vue.onMounted(() => {
        requireLogin();
        uni.getNetworkType({
          success: (res) => {
            online.value = res.networkType !== "none";
          }
        });
        uni.onNetworkStatusChange((res) => {
          online.value = res.isConnected;
          if (res.isConnected)
            refresh();
        });
      });
      onShow(() => {
        if (session2.token)
          refresh();
      });
      async function refresh() {
        try {
          const res = await homeApi.overview();
          data.value = res;
        } catch (e) {
        } finally {
          loading.value = false;
        }
      }
      async function claim(task) {
        try {
          await taskApi.claim(task.id);
          uni.showToast({ title: "已认领，记得去做", icon: "none" });
          refresh();
        } catch (e) {
        }
      }
      function go$1(url2) {
        go(url2);
      }
      const __returned__ = { session: session2, data, loading, online, isElder: isElder2, refresh, claim, go: go$1, ref: vue.ref, computed: vue.computed, onMounted: vue.onMounted, get onShow() {
        return onShow;
      }, JdNav, JdTabbar, JdAvatar, JdStatus, JdRing, JdIcon, get homeApi() {
        return homeApi;
      }, get taskApi() {
        return taskApi;
      }, get useSession() {
        return useSession;
      }, get requireLogin() {
        return requireLogin;
      }, get nav() {
        return go;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$e(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_u_loading_icon = resolveEasycom(vue.resolveDynamicComponent("u-loading-icon"), __easycom_0);
    return vue.openBlock(), vue.createElementBlock("view", { class: "jd-page" }, [
      vue.createVNode($setup["JdNav"], {
        title: "家灯",
        action: $setup.isElder ? "" : "＋",
        onAction: _cache[0] || (_cache[0] = ($event) => $setup.go("/pages/create/create"))
      }, null, 8, ["action"]),
      vue.createElementVNode("scroll-view", {
        class: "jd-body scroll",
        "scroll-y": "",
        "show-scrollbar": false
      }, [
        $setup.loading && !$setup.data ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "loading"
        }, [
          vue.createVNode(_component_u_loading_icon, {
            mode: "circle",
            color: "#C2410C",
            size: "22"
          }),
          vue.createElementVNode("text", { class: "t12 c3 mt10" }, "正在同步今天的安排…")
        ])) : $setup.data ? (vue.openBlock(), vue.createElementBlock(
          vue.Fragment,
          { key: 1 },
          [
            vue.createElementVNode("view", { class: "between mt6" }, [
              vue.createElementVNode("view", { class: "f1" }, [
                vue.createElementVNode(
                  "text",
                  { class: "t22 b" },
                  vue.toDisplayString($setup.data.greeting) + "，" + vue.toDisplayString($setup.data.userName),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode(
                  "view",
                  { class: "t12 c3 mt4" },
                  vue.toDisplayString($setup.data.dateLabel) + " · 已协作 " + vue.toDisplayString($setup.data.connectDays) + " 天",
                  1
                  /* TEXT */
                )
              ]),
              vue.createElementVNode("view", { class: "stack" }, [
                (vue.openBlock(true), vue.createElementBlock(
                  vue.Fragment,
                  null,
                  vue.renderList($setup.data.members, (m) => {
                    return vue.openBlock(), vue.createBlock($setup["JdAvatar"], {
                      key: m.id,
                      text: m.userId === $setup.data.user.id ? "我" : m.avatarText,
                      color: m.avatarColor
                    }, null, 8, ["text", "color"]);
                  }),
                  128
                  /* KEYED_FRAGMENT */
                ))
              ])
            ]),
            vue.createElementVNode("view", { class: "sync-bar mt12" }, [
              vue.createElementVNode("view", { class: "row g8 f1" }, [
                vue.createElementVNode(
                  "text",
                  { class: "t11 cok sb" },
                  "● " + vue.toDisplayString($setup.online ? $setup.data.sync.label : "离线缓存"),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode(
                  "text",
                  { class: "t11 c2" },
                  vue.toDisplayString($setup.online ? $setup.data.sync.lastSyncLabel : "网络恢复后自动同步") + " · " + vue.toDisplayString($setup.data.sync.tip),
                  1
                  /* TEXT */
                )
              ])
            ]),
            vue.createElementVNode("view", {
              class: "card hero mt12",
              onClick: _cache[1] || (_cache[1] = ($event) => $setup.go("/pages/board/board"))
            }, [
              vue.createElementVNode("view", { class: "between" }, [
                vue.createElementVNode("view", null, [
                  vue.createElementVNode("view", { class: "t12 c2 sb" }, "本周完成率"),
                  vue.createElementVNode("view", { class: "row g4 mt2 rate-row" }, [
                    vue.createElementVNode(
                      "text",
                      { class: "t36 b cbrand num" },
                      vue.toDisplayString($setup.data.stats.completionRate),
                      1
                      /* TEXT */
                    ),
                    vue.createElementVNode("text", { class: "t14 c2 b" }, "%"),
                    vue.createElementVNode(
                      "text",
                      { class: "t11 c3 ml4" },
                      "+" + vue.toDisplayString($setup.data.stats.deltaVsLastWeek) + " / 上周",
                      1
                      /* TEXT */
                    )
                  ])
                ]),
                vue.createVNode($setup["JdRing"], {
                  value: $setup.data.stats.completionRate,
                  label: `${$setup.data.stats.doneCount}/${$setup.data.stats.totalCount}`
                }, null, 8, ["value", "label"])
              ]),
              vue.createElementVNode("view", { class: "chart mt14" }, [
                (vue.openBlock(true), vue.createElementBlock(
                  vue.Fragment,
                  null,
                  vue.renderList($setup.data.stats.bars, (bar, i) => {
                    return vue.openBlock(), vue.createElementBlock("view", {
                      key: i,
                      class: "chart-col"
                    }, [
                      vue.createElementVNode(
                        "view",
                        {
                          class: vue.normalizeClass(["chart-bar", { today: bar.isToday }]),
                          style: vue.normalizeStyle({ height: Math.max(6, bar.value) + "%" })
                        },
                        null,
                        6
                        /* CLASS, STYLE */
                      )
                    ]);
                  }),
                  128
                  /* KEYED_FRAGMENT */
                ))
              ]),
              vue.createElementVNode("view", { class: "row between mt6 chart-labels" }, [
                (vue.openBlock(true), vue.createElementBlock(
                  vue.Fragment,
                  null,
                  vue.renderList($setup.data.stats.bars, (bar, i) => {
                    return vue.openBlock(), vue.createElementBlock(
                      "text",
                      {
                        key: i,
                        class: "t10 c3"
                      },
                      vue.toDisplayString(bar.weekday),
                      1
                      /* TEXT */
                    );
                  }),
                  128
                  /* KEYED_FRAGMENT */
                ))
              ])
            ]),
            vue.createElementVNode("view", { class: "row g8 mt12" }, [
              vue.createElementVNode("view", { class: "kpi f1" }, [
                vue.createElementVNode(
                  "view",
                  { class: "k" },
                  vue.toDisplayString($setup.data.kpi.pendingClaim),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode("view", { class: "l" }, "待认领")
              ]),
              vue.createElementVNode("view", { class: "kpi f1" }, [
                vue.createElementVNode(
                  "view",
                  { class: "k" },
                  vue.toDisplayString($setup.data.kpi.pendingConfirm),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode("view", { class: "l" }, "待确认")
              ]),
              vue.createElementVNode("view", { class: "kpi f1" }, [
                vue.createElementVNode("view", { class: "k" }, [
                  vue.createTextVNode(
                    vue.toDisplayString($setup.data.kpi.nextCheckupDays !== null ? $setup.data.kpi.nextCheckupDays : "—"),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode("text", { class: "t11" }, "天")
                ]),
                vue.createElementVNode("view", { class: "l" }, "下次复查")
              ])
            ]),
            vue.createElementVNode("view", { class: "sec" }, [
              vue.createElementVNode("view", { class: "h" }, "今天"),
              !$setup.isElder ? (vue.openBlock(), vue.createElementBlock("text", {
                key: 0,
                class: "more",
                onClick: _cache[2] || (_cache[2] = ($event) => $setup.go("/pages/board/board"))
              }, "看板 ›")) : vue.createCommentVNode("v-if", true)
            ]),
            !$setup.data.todayTasks.length ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 0,
              class: "card flat empty-card"
            }, [
              vue.createElementVNode("text", { class: "t13 c3" }, "今天还没有安排，也是一件好事。")
            ])) : vue.createCommentVNode("v-if", true),
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList($setup.data.todayTasks, (task) => {
                return vue.openBlock(), vue.createElementBlock("view", {
                  key: task.id,
                  class: "card tight task-card",
                  onClick: ($event) => $setup.go("/pages/detail/detail?id=" + task.id)
                }, [
                  vue.createElementVNode("view", { class: "between" }, [
                    vue.createElementVNode("view", { class: "row g6" }, [
                      vue.createVNode($setup["JdStatus"], {
                        label: task.statusLabel,
                        tone: task.tone
                      }, null, 8, ["label", "tone"]),
                      vue.createElementVNode(
                        "view",
                        { class: "tag" },
                        vue.toDisplayString(task.category),
                        1
                        /* TEXT */
                      )
                    ]),
                    vue.createElementVNode(
                      "text",
                      { class: "t12 c3 num" },
                      vue.toDisplayString(task.time),
                      1
                      /* TEXT */
                    )
                  ]),
                  vue.createElementVNode(
                    "view",
                    { class: "t15 sb mt8 task-title" },
                    vue.toDisplayString(task.title),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode("view", { class: "between mt10" }, [
                    vue.createElementVNode("view", { class: "row g6" }, [
                      task.assignee ? (vue.openBlock(), vue.createElementBlock(
                        vue.Fragment,
                        { key: 0 },
                        [
                          vue.createVNode($setup["JdAvatar"], {
                            text: task.assignee.avatarText,
                            color: task.assignee.avatarColor,
                            size: "sm"
                          }, null, 8, ["text", "color"]),
                          vue.createElementVNode(
                            "text",
                            { class: "t12 c2" },
                            vue.toDisplayString(task.assignee.name),
                            1
                            /* TEXT */
                          )
                        ],
                        64
                        /* STABLE_FRAGMENT */
                      )) : (vue.openBlock(), vue.createElementBlock("text", {
                        key: 1,
                        class: "t11 c3"
                      }, "已提醒 " + vue.toDisplayString(2) + " 人 · 无人接"))
                    ]),
                    task.evidenceCount ? (vue.openBlock(), vue.createElementBlock("view", {
                      key: 0,
                      class: "row g4 t11 c3"
                    }, [
                      vue.createVNode($setup["JdIcon"], {
                        name: "camera",
                        size: 13,
                        color: "#7A6E63"
                      }),
                      vue.createElementVNode(
                        "text",
                        null,
                        "已传 " + vue.toDisplayString(task.evidenceCount) + " 张",
                        1
                        /* TEXT */
                      )
                    ])) : task.status === "pending_claim" && !$setup.isElder ? (vue.openBlock(), vue.createElementBlock("button", {
                      key: 1,
                      class: "btn btn-2nd btn-sm",
                      onClick: vue.withModifiers(($event) => $setup.claim(task), ["stop"])
                    }, " 我来 ", 8, ["onClick"])) : vue.createCommentVNode("v-if", true)
                  ])
                ], 8, ["onClick"]);
              }),
              128
              /* KEYED_FRAGMENT */
            )),
            vue.createElementVNode("view", { class: "sec" }, [
              vue.createElementVNode("view", { class: "h" }, "常用")
            ]),
            $setup.isElder ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 1,
              class: "card elder-entry",
              onClick: _cache[3] || (_cache[3] = ($event) => $setup.go("/pages/elder/elder"))
            }, [
              vue.createElementVNode("view", { class: "row g10" }, [
                vue.createElementVNode("view", { class: "elder-icon" }, [
                  vue.createVNode($setup["JdIcon"], {
                    name: "sun",
                    size: 22,
                    color: "#C2410C"
                  })
                ]),
                vue.createElementVNode("view", { class: "f1" }, [
                  vue.createElementVNode("text", { class: "t15 sb" }, "关怀版"),
                  vue.createElementVNode("view", { class: "t11 c3 mt4" }, "字更大、一屏一件事，按一下就算做完")
                ]),
                vue.createElementVNode("text", { class: "chev" }, "›")
              ])
            ])) : (vue.openBlock(), vue.createElementBlock("view", {
              key: 2,
              class: "row g8 quick"
            }, [
              (vue.openBlock(true), vue.createElementBlock(
                vue.Fragment,
                null,
                vue.renderList($setup.data.quickActions, (action) => {
                  return vue.openBlock(), vue.createElementBlock("view", {
                    key: action.key,
                    class: "btn btn-ghost quick-btn",
                    onClick: ($event) => $setup.go(action.path)
                  }, [
                    vue.createVNode($setup["JdIcon"], {
                      name: action.icon,
                      size: 18,
                      color: "#171210"
                    }, null, 8, ["name"]),
                    vue.createElementVNode(
                      "text",
                      { class: "t11" },
                      vue.toDisplayString(action.label),
                      1
                      /* TEXT */
                    )
                  ], 8, ["onClick"]);
                }),
                128
                /* KEYED_FRAGMENT */
              ))
            ]))
          ],
          64
          /* STABLE_FRAGMENT */
        )) : vue.createCommentVNode("v-if", true)
      ]),
      vue.createVNode($setup["JdTabbar"], {
        active: "home",
        badge: $setup.data && $setup.data.kpi.pendingClaim > 0
      }, null, 8, ["badge"])
    ]);
  }
  const PagesHomeHome = /* @__PURE__ */ _export_sfc(_sfc_main$f, [["render", _sfc_render$e], ["__scopeId", "data-v-0cd09a48"], ["__file", "D:/workZone/APP/frontend/src/pages/home/home.vue"]]);
  const _sfc_main$e = {
    __name: "board",
    setup(__props, { expose: __expose }) {
      __expose();
      const session2 = useSession();
      const days = vue.ref([]);
      const weekDays = vue.ref([]);
      const filters = vue.ref([]);
      const statuses = vue.ref([]);
      const filter = vue.ref("all");
      const status = vue.ref("");
      const selectedDate = vue.ref("");
      const showFilter = vue.ref(false);
      const currentUserId = vue.computed(() => session2.user ? session2.user.id : 0);
      const visibleDays = vue.computed(() => {
        const list = selectedDate.value ? days.value.filter((d) => d.date === selectedDate.value) : days.value;
        return list.filter((d) => d.tasks.length || !selectedDate.value && d.isToday);
      });
      vue.onMounted(() => {
        load();
        taskApi.meta().then((m) => {
          statuses.value = m.statuses.filter((s) => !["cancelled", "skipped"].includes(s.key));
        }).catch(() => {
        });
      });
      onShow(() => {
        if (session2.token)
          load();
      });
      async function load() {
        try {
          const res = await taskApi.list({ range: "week", filter: filter.value, status: status.value });
          days.value = res.days;
          weekDays.value = res.weekDays;
          filters.value = res.filters;
        } catch (e) {
        }
      }
      function pickDay(d) {
        selectedDate.value = selectedDate.value === d.date ? "" : d.date;
      }
      function setFilter(key) {
        filter.value = key;
        load();
      }
      function setStatus(key) {
        status.value = key;
        showFilter.value = false;
        load();
      }
      function isMine(task) {
        return task.assignee && task.assignee.id === currentUserId.value;
      }
      function periodOf(time) {
        const h = Number((time || "00:00").slice(0, 2));
        if (h < 6)
          return "凌晨";
        if (h < 12)
          return "上午";
        if (h < 18)
          return "下午";
        return "晚上";
      }
      async function claim(task) {
        try {
          await taskApi.claim(task.id);
          uni.showToast({ title: "已认领", icon: "none" });
          load();
        } catch (e) {
        }
      }
      function openTask(task) {
        uni.navigateTo({ url: `/pages/detail/detail?id=${task.id}` });
      }
      function go2(url2) {
        uni.navigateTo({ url: url2 });
      }
      const __returned__ = { session: session2, days, weekDays, filters, statuses, filter, status, selectedDate, showFilter, currentUserId, visibleDays, load, pickDay, setFilter, setStatus, isMine, periodOf, claim, openTask, go: go2, ref: vue.ref, computed: vue.computed, onMounted: vue.onMounted, get onShow() {
        return onShow;
      }, JdNav, JdTabbar, JdStatus, JdAvatar, JdIcon, get taskApi() {
        return taskApi;
      }, get useSession() {
        return useSession;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$d(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_u_popup = resolveEasycom(vue.resolveDynamicComponent("u-popup"), __easycom_0$1);
    return vue.openBlock(), vue.createElementBlock("view", { class: "jd-page" }, [
      vue.createVNode($setup["JdNav"], {
        title: "本周看板",
        action: "筛选",
        onAction: _cache[0] || (_cache[0] = ($event) => $setup.showFilter = true)
      }),
      vue.createElementVNode("scroll-view", {
        class: "jd-body scroll",
        "scroll-y": "",
        "show-scrollbar": false
      }, [
        vue.createElementVNode("view", { class: "card flat tight date-strip" }, [
          vue.createElementVNode("view", { class: "row g4" }, [
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList($setup.weekDays, (d) => {
                return vue.openBlock(), vue.createElementBlock("view", {
                  key: d.date,
                  class: vue.normalizeClass(["day", { on: $setup.selectedDate ? $setup.selectedDate === d.date : d.isToday }]),
                  onClick: ($event) => $setup.pickDay(d)
                }, [
                  vue.createElementVNode(
                    "text",
                    { class: "w" },
                    vue.toDisplayString(d.weekday),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode(
                    "text",
                    { class: "d num" },
                    vue.toDisplayString(d.dayNumber),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode(
                    "view",
                    {
                      class: vue.normalizeClass(["dot", { show: d.hasOpen }])
                    },
                    null,
                    2
                    /* CLASS */
                  )
                ], 10, ["onClick"]);
              }),
              128
              /* KEYED_FRAGMENT */
            ))
          ])
        ]),
        vue.createElementVNode("view", { class: "row g6 mt12 chips-row" }, [
          (vue.openBlock(true), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($setup.filters, (f) => {
              return vue.openBlock(), vue.createElementBlock("view", {
                key: f.key,
                class: vue.normalizeClass(["chip", { on: $setup.filter === f.key }]),
                onClick: ($event) => $setup.setFilter(f.key)
              }, vue.toDisplayString(f.label) + " " + vue.toDisplayString(f.count), 11, ["onClick"]);
            }),
            128
            /* KEYED_FRAGMENT */
          ))
        ]),
        !$setup.visibleDays.length ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "empty"
        }, [
          vue.createElementVNode("view", { class: "ic" }, "🕯️"),
          vue.createElementVNode("view", { class: "t13" }, "这一周还没有安排"),
          vue.createElementVNode("view", { class: "t11 c3 mt6" }, "点右下角 ＋ 派一件事")
        ])) : vue.createCommentVNode("v-if", true),
        (vue.openBlock(true), vue.createElementBlock(
          vue.Fragment,
          null,
          vue.renderList($setup.visibleDays, (day) => {
            return vue.openBlock(), vue.createElementBlock("view", {
              key: day.date,
              class: "day-group"
            }, [
              vue.createElementVNode("view", { class: "between mt16 mb8" }, [
                vue.createElementVNode(
                  "text",
                  { class: "t12 c2 sb" },
                  vue.toDisplayString(day.label),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode(
                  "text",
                  { class: "t11 c3" },
                  vue.toDisplayString(day.count) + " 件事",
                  1
                  /* TEXT */
                )
              ]),
              (vue.openBlock(true), vue.createElementBlock(
                vue.Fragment,
                null,
                vue.renderList(day.tasks, (task) => {
                  return vue.openBlock(), vue.createElementBlock("view", {
                    key: task.id,
                    class: "card tight task-card",
                    onClick: ($event) => $setup.openTask(task)
                  }, [
                    vue.createElementVNode("view", { class: "row g10" }, [
                      vue.createElementVNode("view", { class: "time-col" }, [
                        vue.createElementVNode(
                          "text",
                          { class: "t14 b num" },
                          vue.toDisplayString(task.time),
                          1
                          /* TEXT */
                        ),
                        vue.createElementVNode(
                          "text",
                          { class: "t10 c3 mt2" },
                          vue.toDisplayString($setup.periodOf(task.time)),
                          1
                          /* TEXT */
                        )
                      ]),
                      vue.createElementVNode(
                        "view",
                        {
                          class: vue.normalizeClass(["axis", { mine: $setup.isMine(task) }])
                        },
                        null,
                        2
                        /* CLASS */
                      ),
                      vue.createElementVNode("view", { class: "f1" }, [
                        vue.createElementVNode("view", { class: "row g6" }, [
                          vue.createVNode($setup["JdStatus"], {
                            label: task.statusLabel,
                            tone: task.tone
                          }, null, 8, ["label", "tone"]),
                          vue.createElementVNode(
                            "view",
                            { class: "tag" },
                            vue.toDisplayString(task.category),
                            1
                            /* TEXT */
                          ),
                          task.isUrgent ? (vue.openBlock(), vue.createElementBlock("view", {
                            key: 0,
                            class: "tag brand"
                          }, "紧急")) : vue.createCommentVNode("v-if", true)
                        ]),
                        vue.createElementVNode(
                          "view",
                          { class: "t15 sb mt6 title" },
                          vue.toDisplayString(task.title),
                          1
                          /* TEXT */
                        ),
                        vue.createElementVNode("view", { class: "row g6 mt8" }, [
                          task.assignee ? (vue.openBlock(), vue.createElementBlock(
                            vue.Fragment,
                            { key: 0 },
                            [
                              vue.createVNode($setup["JdAvatar"], {
                                text: task.assignee.avatarText,
                                color: task.assignee.avatarColor,
                                size: "sm"
                              }, null, 8, ["text", "color"]),
                              vue.createElementVNode(
                                "text",
                                { class: "t11 c3" },
                                vue.toDisplayString(task.assignee.name) + vue.toDisplayString(task.assignee.id === $setup.currentUserId ? " · 我负责" : ""),
                                1
                                /* TEXT */
                              )
                            ],
                            64
                            /* STABLE_FRAGMENT */
                          )) : (vue.openBlock(), vue.createElementBlock(
                            vue.Fragment,
                            { key: 1 },
                            [
                              vue.createElementVNode("text", { class: "t11 c3" }, "待认领 · 已提醒 2 人"),
                              vue.createElementVNode("button", {
                                class: "btn btn-2nd btn-sm",
                                onClick: vue.withModifiers(($event) => $setup.claim(task), ["stop"])
                              }, "认领", 8, ["onClick"])
                            ],
                            64
                            /* STABLE_FRAGMENT */
                          )),
                          task.repeatRule !== "none" ? (vue.openBlock(), vue.createElementBlock("text", {
                            key: 2,
                            class: "t11 c3"
                          }, "· 重复")) : vue.createCommentVNode("v-if", true)
                        ])
                      ])
                    ])
                  ], 8, ["onClick"]);
                }),
                128
                /* KEYED_FRAGMENT */
              ))
            ]);
          }),
          128
          /* KEYED_FRAGMENT */
        ))
      ]),
      vue.createElementVNode("view", {
        class: "fab",
        onClick: _cache[1] || (_cache[1] = ($event) => $setup.go("/pages/create/create"))
      }, [
        vue.createVNode($setup["JdIcon"], {
          name: "plus",
          size: 26,
          color: "#FFFFFF"
        })
      ]),
      vue.createVNode($setup["JdTabbar"], { active: "board" }),
      vue.createVNode(_component_u_popup, {
        show: $setup.showFilter,
        "onUpdate:show": _cache[3] || (_cache[3] = ($event) => $setup.showFilter = $event),
        mode: "bottom",
        round: "20",
        safeAreaInsetBottom: true
      }, {
        default: vue.withCtx(() => [
          vue.createElementVNode("view", { class: "pop" }, [
            vue.createElementVNode("view", { class: "pop-title" }, "按状态筛选"),
            vue.createElementVNode("view", { class: "list mt10" }, [
              vue.createElementVNode("view", {
                class: "li",
                onClick: _cache[2] || (_cache[2] = ($event) => $setup.setStatus(""))
              }, [
                vue.createElementVNode("text", { class: "lb" }, "全部状态"),
                !$setup.status ? (vue.openBlock(), vue.createElementBlock("text", {
                  key: 0,
                  class: "t11 cbrand",
                  style: { "margin-left": "auto" }
                }, "已选")) : vue.createCommentVNode("v-if", true)
              ]),
              (vue.openBlock(true), vue.createElementBlock(
                vue.Fragment,
                null,
                vue.renderList($setup.statuses, (s) => {
                  return vue.openBlock(), vue.createElementBlock("view", {
                    key: s.key,
                    class: "li",
                    onClick: ($event) => $setup.setStatus(s.key)
                  }, [
                    vue.createVNode($setup["JdStatus"], {
                      label: s.label,
                      tone: s.tone
                    }, null, 8, ["label", "tone"]),
                    $setup.status === s.key ? (vue.openBlock(), vue.createElementBlock("text", {
                      key: 0,
                      class: "t11 cbrand",
                      style: { "margin-left": "auto" }
                    }, "已选")) : vue.createCommentVNode("v-if", true)
                  ], 8, ["onClick"]);
                }),
                128
                /* KEYED_FRAGMENT */
              ))
            ])
          ])
        ]),
        _: 1
        /* STABLE */
      }, 8, ["show"])
    ]);
  }
  const PagesBoardBoard = /* @__PURE__ */ _export_sfc(_sfc_main$e, [["render", _sfc_render$d], ["__scopeId", "data-v-83031968"], ["__file", "D:/workZone/APP/frontend/src/pages/board/board.vue"]]);
  const _sfc_main$d = {
    __name: "schedule",
    setup(__props, { expose: __expose }) {
      __expose();
      const session2 = useSession();
      const data = vue.ref(null);
      const weekStart = vue.ref("");
      const canEdit = vue.computed(() => Boolean(data.value && data.value.canEdit));
      vue.onMounted(load);
      onShow(() => {
        if (session2.token)
          load();
      });
      async function load() {
        try {
          data.value = await scheduleApi.get(weekStart.value);
          weekStart.value = data.value.weekStart;
        } catch (e) {
        }
      }
      function shiftWeek(delta) {
        const base = weekStart.value ? /* @__PURE__ */ new Date(weekStart.value + "T00:00:00") : /* @__PURE__ */ new Date();
        base.setDate(base.getDate() + delta * 7);
        const y = base.getFullYear();
        const m = String(base.getMonth() + 1).padStart(2, "0");
        const d = String(base.getDate()).padStart(2, "0");
        weekStart.value = `${y}-${m}-${d}`;
        load();
      }
      function shortName(m) {
        if (m.userId === (session2.user && session2.user.id))
          return "我";
        if (m.relation === "爸爸")
          return "爸爸";
        if (m.relation === "妈妈")
          return "妈妈";
        if (m.relation === "妹妹")
          return "妹妹";
        return m.name.slice(0, 1);
      }
      function isWeekend(date2) {
        const d = /* @__PURE__ */ new Date(date2 + "T00:00:00");
        const w = d.getDay();
        return w === 0 || w === 6;
      }
      function cellClass(m, cell) {
        if (!cell.hasDuty)
          return "off";
        return m.avatarColor;
      }
      function colorOf(memberId) {
        const m = data.value && data.value.members.find((x) => x.userId === memberId);
        return m ? m.avatarColor : "owner";
      }
      async function toggleCell(m, cell) {
        if (!data.value.canEdit) {
          uni.showToast({ title: "仅主理子女可排班", icon: "none" });
          return;
        }
        try {
          await scheduleApi.toggle({ memberId: m.userId, date: cell.date, hasDuty: !cell.hasDuty });
          load();
        } catch (e) {
        }
      }
      async function autoAssign() {
        try {
          await scheduleApi.auto();
          uni.showToast({ title: "已重新分配", icon: "none" });
          load();
        } catch (e) {
        }
      }
      async function generate() {
        try {
          const res = await scheduleApi.generate(weekStart.value);
          uni.showToast({ title: res.created ? `已生成 ${res.created} 条任务` : "本周任务已存在", icon: "none" });
        } catch (e) {
        }
      }
      const __returned__ = { session: session2, data, weekStart, canEdit, load, shiftWeek, shortName, isWeekend, cellClass, colorOf, toggleCell, autoAssign, generate, ref: vue.ref, computed: vue.computed, onMounted: vue.onMounted, get onShow() {
        return onShow;
      }, JdNav, JdTabbar, JdAvatar, get scheduleApi() {
        return scheduleApi;
      }, get useSession() {
        return useSession;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$c(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "jd-page" }, [
      vue.createVNode($setup["JdNav"], {
        title: "排班表",
        action: $setup.canEdit ? "生成任务" : "",
        onAction: $setup.generate
      }, null, 8, ["action"]),
      vue.createElementVNode("scroll-view", {
        class: "jd-body scroll",
        "scroll-y": "",
        "show-scrollbar": false
      }, [
        vue.createElementVNode("view", { class: "between mt6" }, [
          vue.createElementVNode(
            "text",
            { class: "t12 c2" },
            vue.toDisplayString($setup.data ? $setup.data.weekLabel : "本周"),
            1
            /* TEXT */
          ),
          vue.createElementVNode("view", { class: "row g4" }, [
            vue.createElementVNode("view", {
              class: "chip week-btn",
              onClick: _cache[0] || (_cache[0] = ($event) => $setup.shiftWeek(-1))
            }, "‹"),
            vue.createElementVNode("view", {
              class: "chip week-btn",
              onClick: _cache[1] || (_cache[1] = ($event) => $setup.shiftWeek(1))
            }, "›")
          ])
        ]),
        $setup.data ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "card flat tight table-card mt10"
        }, [
          vue.createElementVNode("view", { class: "table-head" }, [
            vue.createElementVNode("view", { class: "member-col head-cell" }, "成员"),
            vue.createElementVNode("view", { class: "days-row" }, [
              (vue.openBlock(true), vue.createElementBlock(
                vue.Fragment,
                null,
                vue.renderList($setup.data.days, (d) => {
                  return vue.openBlock(), vue.createElementBlock(
                    "view",
                    {
                      key: d.date,
                      class: vue.normalizeClass(["head-cell day-cell", { today: d.isToday, weekend: d.isWeekend }])
                    },
                    vue.toDisplayString(d.weekday),
                    3
                    /* TEXT, CLASS */
                  );
                }),
                128
                /* KEYED_FRAGMENT */
              ))
            ])
          ]),
          (vue.openBlock(true), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($setup.data.members, (m) => {
              return vue.openBlock(), vue.createElementBlock("view", {
                key: m.id,
                class: "table-row"
              }, [
                vue.createElementVNode("view", { class: "member-col member-name" }, [
                  vue.createVNode($setup["JdAvatar"], {
                    text: m.avatarText,
                    color: m.avatarColor,
                    size: "xs"
                  }, null, 8, ["text", "color"]),
                  vue.createElementVNode(
                    "text",
                    { class: "t12 sb ml6" },
                    vue.toDisplayString($setup.shortName(m)),
                    1
                    /* TEXT */
                  )
                ]),
                vue.createElementVNode("view", { class: "days-row cells" }, [
                  (vue.openBlock(true), vue.createElementBlock(
                    vue.Fragment,
                    null,
                    vue.renderList(m.cells, (cell) => {
                      return vue.openBlock(), vue.createElementBlock("view", {
                        key: cell.date,
                        class: vue.normalizeClass(["cell", [$setup.cellClass(m, cell), { weekend: $setup.isWeekend(cell.date) }]]),
                        onClick: ($event) => $setup.toggleCell(m, cell)
                      }, null, 10, ["onClick"]);
                    }),
                    128
                    /* KEYED_FRAGMENT */
                  ))
                ])
              ]);
            }),
            128
            /* KEYED_FRAGMENT */
          ))
        ])) : vue.createCommentVNode("v-if", true),
        $setup.data ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 1,
          class: "row g12 mt10 legend"
        }, [
          vue.createElementVNode("view", { class: "row g4" }, [
            vue.createElementVNode("view", { class: "sq owner" }),
            vue.createElementVNode("text", { class: "t10 c3" }, "我的班")
          ]),
          vue.createElementVNode("view", { class: "row g4" }, [
            vue.createElementVNode("view", { class: "sq sis" }),
            vue.createElementVNode("text", { class: "t10 c3" }, "妹妹")
          ]),
          vue.createElementVNode("view", { class: "row g4" }, [
            vue.createElementVNode("view", { class: "sq dad" }),
            vue.createElementVNode("text", { class: "t10 c3" }, "爸爸自理")
          ]),
          vue.createElementVNode("view", { class: "row g4" }, [
            vue.createElementVNode("view", { class: "sq mom" }),
            vue.createElementVNode("text", { class: "t10 c3" }, "妈妈")
          ])
        ])) : vue.createCommentVNode("v-if", true),
        vue.createElementVNode("view", { class: "sec" }, [
          vue.createElementVNode("view", { class: "h" }, [
            vue.createTextVNode("本周分工"),
            vue.createElementVNode("span", { class: "sub" }, "自动按空闲时间建议")
          ]),
          vue.createElementVNode("text", {
            class: "more",
            onClick: $setup.autoAssign
          }, "重排")
        ]),
        $setup.data && $setup.data.duties.length ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 2,
          class: "list"
        }, [
          (vue.openBlock(true), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($setup.data.duties, (duty) => {
              return vue.openBlock(), vue.createElementBlock("view", {
                key: duty.id,
                class: "li"
              }, [
                vue.createVNode($setup["JdAvatar"], {
                  text: duty.memberName.slice(0, 1),
                  color: $setup.colorOf(duty.memberId),
                  size: "sm"
                }, null, 8, ["text", "color"]),
                vue.createElementVNode("view", { class: "f1" }, [
                  vue.createElementVNode(
                    "text",
                    { class: "lb" },
                    vue.toDisplayString(duty.dayLabel),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode(
                    "view",
                    { class: "t11 c3 mt4" },
                    vue.toDisplayString(duty.memberName) + " 负责 · 已写入排班",
                    1
                    /* TEXT */
                  )
                ]),
                vue.createElementVNode("view", { class: "st done" }, [
                  vue.createElementVNode("view", { class: "dot" }),
                  vue.createElementVNode("text", null, "已定")
                ])
              ]);
            }),
            128
            /* KEYED_FRAGMENT */
          ))
        ])) : (vue.openBlock(), vue.createElementBlock("view", {
          key: 3,
          class: "card flat tight tc"
        }, [
          vue.createElementVNode("text", { class: "t12 c3" }, "这周还没有排班，点「重排」让家灯给个建议。")
        ])),
        vue.createElementVNode("view", { class: "disc mt14" }, [
          vue.createElementVNode("text", { class: "b" }, "排班只是建议。"),
          vue.createTextVNode(" 长辈端看到的永远是「今天做什么」，不会看到「谁哪天没排班」。 ")
        ])
      ]),
      vue.createVNode($setup["JdTabbar"], { active: "board" })
    ]);
  }
  const PagesScheduleSchedule = /* @__PURE__ */ _export_sfc(_sfc_main$d, [["render", _sfc_render$c], ["__scopeId", "data-v-67381f1f"], ["__file", "D:/workZone/APP/frontend/src/pages/schedule/schedule.vue"]]);
  const _sfc_main$c = {
    __name: "JdSwitch",
    props: {
      modelValue: { type: Boolean, default: false },
      size: { type: String, default: "md" },
      disabled: { type: Boolean, default: false }
    },
    emits: ["update:modelValue", "change"],
    setup(__props, { expose: __expose, emit: __emit }) {
      __expose();
      const props2 = __props;
      const emit = __emit;
      function toggle() {
        if (props2.disabled)
          return;
        emit("update:modelValue", !props2.modelValue);
        emit("change", !props2.modelValue);
      }
      const __returned__ = { props: props2, emit, toggle };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$b(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock(
      "view",
      {
        class: vue.normalizeClass(["sw", { on: $props.modelValue, sm: $props.size === "sm" }]),
        onClick: $setup.toggle
      },
      [
        vue.createElementVNode("view", { class: "knob" })
      ],
      2
      /* CLASS */
    );
  }
  const JdSwitch = /* @__PURE__ */ _export_sfc(_sfc_main$c, [["render", _sfc_render$b], ["__scopeId", "data-v-b6df9711"], ["__file", "D:/workZone/APP/frontend/src/components/JdSwitch.vue"]]);
  const _sfc_main$b = {
    __name: "create",
    setup(__props, { expose: __expose }) {
      __expose();
      const session2 = useSession();
      const now = /* @__PURE__ */ new Date();
      const pad = (n) => String(n).padStart(2, "0");
      const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      const form = vue.ref({
        title: "",
        date: todayStr,
        time: "09:00",
        category: "复查",
        repeatRule: "none",
        assigneeId: null,
        location: "",
        remindLabel: "提前 1 天 20:00",
        isUrgent: false,
        needConfirm: true
      });
      const members = vue.ref([]);
      const templates = vue.ref([]);
      const categories = vue.ref(["复查", "取药", "测量", "缴费", "用药", "其他"]);
      const repeatOptions = vue.ref([{ key: "none", label: "不重复" }]);
      const remindOptions = vue.ref(["提前 1 天 20:00", "提前 2 小时", "到点提醒"]);
      const remindIndex = vue.ref(0);
      const elderName = vue.ref("王建国");
      const elderCondition = vue.ref("高血压 · 复诊");
      const showTemplates = vue.ref(false);
      const showLocation = vue.ref(false);
      const locationDraft = vue.ref("");
      const submitting = vue.ref(false);
      const locationOptions = ["市一院 3 号楼", "社区医院", "家里", "社区卫生服务中心"];
      const dateLabel = vue.computed(() => {
        const d = /* @__PURE__ */ new Date(form.value.date + "T00:00:00");
        const w = ["日", "一", "二", "三", "四", "五", "六"][d.getDay()];
        return `${pad(d.getMonth() + 1)}/${pad(d.getDate())} 周${w}`;
      });
      const assigneeLabel = vue.computed(() => {
        if (form.value.assigneeId === null)
          return "待认领";
        const m = members.value.find((x) => x.userId === form.value.assigneeId);
        return m ? m.name : "待认领";
      });
      onLoad(() => {
        const d = /* @__PURE__ */ new Date();
        d.setDate(d.getDate() + 1);
        form.value.date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      });
      vue.onMounted(async () => {
        try {
          const meta = await taskApi.meta();
          members.value = meta.members;
          templates.value = meta.templates;
          if (meta.categories && meta.categories.length)
            categories.value = meta.categories;
          repeatOptions.value = meta.repeatOptions;
          remindOptions.value = meta.remindOptions;
          if (meta.elder)
            form.value.elderId = meta.elder.id;
          if (meta.elder) {
            elderName.value = meta.elder.name;
            elderCondition.value = session2.elder && session2.elder.conditions || "高血压 · 复诊";
          }
        } catch (e) {
        }
      });
      function onDate(e) {
        form.value.date = e.detail.value;
      }
      function onTime(e) {
        form.value.time = e.detail.value;
      }
      function onRemind(e) {
        remindIndex.value = Number(e.detail.value);
        form.value.remindLabel = remindOptions.value[remindIndex.value];
      }
      function shortName(m) {
        if (m.relation === "爸爸" || m.relation === "妈妈" || m.relation === "妹妹")
          return m.relation;
        return m.name.slice(0, 1);
      }
      function applyTemplate(tpl) {
        form.value.title = tpl.title;
        form.value.category = tpl.category;
        form.value.location = tpl.location;
        showTemplates.value = false;
      }
      function pickLocation(loc) {
        locationDraft.value = loc;
      }
      function saveLocation() {
        form.value.location = locationDraft.value;
        showLocation.value = false;
      }
      async function submit() {
        if (!form.value.title.trim()) {
          uni.showToast({ title: "请先写清楚要做什么", icon: "none" });
          return;
        }
        if (submitting.value)
          return;
        submitting.value = true;
        try {
          const res = await taskApi.create({
            title: form.value.title.trim(),
            category: form.value.category,
            date: form.value.date,
            time: form.value.time,
            durationHours: 3,
            assigneeId: form.value.assigneeId,
            elderId: form.value.elderId || void 0,
            repeatRule: form.value.repeatRule,
            isUrgent: form.value.isUrgent,
            location: form.value.location,
            remindLabel: form.value.remindLabel,
            needConfirm: form.value.needConfirm
          });
          uni.showToast({ title: res.msg || "已派发并通知", icon: "none" });
          const task = res.data || {};
          setTimeout(() => {
            uni.redirectTo({ url: `/pages/detail/detail?id=${task.id}` });
          }, 500);
        } catch (e) {
        } finally {
          submitting.value = false;
        }
      }
      const __returned__ = { session: session2, now, pad, todayStr, form, members, templates, categories, repeatOptions, remindOptions, remindIndex, elderName, elderCondition, showTemplates, showLocation, locationDraft, submitting, locationOptions, dateLabel, assigneeLabel, onDate, onTime, onRemind, shortName, applyTemplate, pickLocation, saveLocation, submit, ref: vue.ref, computed: vue.computed, onMounted: vue.onMounted, get onLoad() {
        return onLoad;
      }, JdNav, JdAvatar, JdSwitch, get taskApi() {
        return taskApi;
      }, get useSession() {
        return useSession;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$a(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_u_popup = resolveEasycom(vue.resolveDynamicComponent("u-popup"), __easycom_0$1);
    return vue.openBlock(), vue.createElementBlock("view", { class: "jd-page" }, [
      vue.createVNode($setup["JdNav"], {
        title: "派发任务",
        back: "",
        action: "模板",
        onAction: _cache[0] || (_cache[0] = ($event) => $setup.showTemplates = true)
      }),
      vue.createElementVNode("scroll-view", {
        class: "jd-body scroll",
        "scroll-y": "",
        "show-scrollbar": false
      }, [
        vue.createElementVNode("view", { class: "field focus" }, [
          vue.createElementVNode("view", { class: "lab" }, [
            vue.createTextVNode("做什么 "),
            vue.createElementVNode("text", { class: "req" }, "*")
          ]),
          vue.withDirectives(vue.createElementVNode(
            "input",
            {
              "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => $setup.form.title = $event),
              class: "input t16",
              placeholder: "例如：陪爸爸去市一院心内科复查",
              "placeholder-class": "ph",
              maxlength: "40"
            },
            null,
            512
            /* NEED_PATCH */
          ), [
            [vue.vModelText, $setup.form.title]
          ])
        ]),
        vue.createElementVNode("view", { class: "row g8 mt8" }, [
          vue.createElementVNode("picker", {
            mode: "date",
            value: $setup.form.date,
            class: "f1",
            onChange: $setup.onDate
          }, [
            vue.createElementVNode("view", { class: "field" }, [
              vue.createElementVNode("view", { class: "lab" }, [
                vue.createTextVNode("日期 "),
                vue.createElementVNode("text", { class: "req" }, "*")
              ]),
              vue.createElementVNode("view", { class: "val num" }, [
                vue.createTextVNode(
                  vue.toDisplayString($setup.dateLabel) + " ",
                  1
                  /* TEXT */
                ),
                vue.createElementVNode("text", { class: "caret" }, "▾")
              ])
            ])
          ], 40, ["value"]),
          vue.createElementVNode("picker", {
            mode: "time",
            value: $setup.form.time,
            class: "f1",
            onChange: $setup.onTime
          }, [
            vue.createElementVNode("view", { class: "field" }, [
              vue.createElementVNode("view", { class: "lab" }, [
                vue.createTextVNode("时间 "),
                vue.createElementVNode("text", { class: "req" }, "*")
              ]),
              vue.createElementVNode("view", { class: "val num" }, [
                vue.createTextVNode(
                  vue.toDisplayString($setup.form.time) + " ",
                  1
                  /* TEXT */
                ),
                vue.createElementVNode("text", { class: "caret" }, "▾")
              ])
            ])
          ], 40, ["value"])
        ]),
        vue.createElementVNode("view", { class: "row g6 mt8 wrap" }, [
          (vue.openBlock(true), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($setup.repeatOptions, (opt) => {
              return vue.openBlock(), vue.createElementBlock("view", {
                key: opt.key,
                class: vue.normalizeClass(["chip", { on: $setup.form.repeatRule === opt.key }]),
                onClick: ($event) => $setup.form.repeatRule = opt.key
              }, vue.toDisplayString(opt.label), 11, ["onClick"]);
            }),
            128
            /* KEYED_FRAGMENT */
          ))
        ]),
        vue.createElementVNode("view", { class: "field mt12" }, [
          vue.createElementVNode("view", { class: "lab" }, "类型"),
          vue.createElementVNode("view", { class: "row g6 mt8 wrap" }, [
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList($setup.categories, (c) => {
                return vue.openBlock(), vue.createElementBlock("view", {
                  key: c,
                  class: vue.normalizeClass(["chip", { on: $setup.form.category === c }]),
                  onClick: ($event) => $setup.form.category = c
                }, vue.toDisplayString(c), 11, ["onClick"]);
              }),
              128
              /* KEYED_FRAGMENT */
            ))
          ])
        ]),
        vue.createElementVNode("view", { class: "field mt12" }, [
          vue.createElementVNode("view", { class: "lab" }, [
            vue.createTextVNode("谁去 "),
            vue.createElementVNode("text", { class: "req" }, "*")
          ]),
          vue.createElementVNode("view", { class: "val" }, [
            vue.createTextVNode(
              vue.toDisplayString($setup.assigneeLabel) + " ",
              1
              /* TEXT */
            ),
            vue.createElementVNode(
              "text",
              { class: "t11 c3 assignee-hint" },
              vue.toDisplayString($setup.form.assigneeId ? "单独通知" : "发到家庭组"),
              1
              /* TEXT */
            )
          ])
        ]),
        vue.createElementVNode("view", { class: "row g6 mt8 wrap" }, [
          (vue.openBlock(true), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($setup.members, (m) => {
              return vue.openBlock(), vue.createElementBlock("view", {
                key: m.userId,
                class: vue.normalizeClass(["chip member-chip", { on: $setup.form.assigneeId === m.userId }]),
                onClick: ($event) => $setup.form.assigneeId = m.userId
              }, [
                vue.createVNode($setup["JdAvatar"], {
                  text: m.avatarText,
                  color: m.avatarColor,
                  size: "xs"
                }, null, 8, ["text", "color"]),
                vue.createElementVNode(
                  "text",
                  null,
                  vue.toDisplayString($setup.shortName(m)),
                  1
                  /* TEXT */
                )
              ], 10, ["onClick"]);
            }),
            128
            /* KEYED_FRAGMENT */
          )),
          vue.createElementVNode(
            "view",
            {
              class: vue.normalizeClass(["chip", { on: $setup.form.assigneeId === null }]),
              onClick: _cache[2] || (_cache[2] = ($event) => $setup.form.assigneeId = null)
            },
            " 待认领 ",
            2
            /* CLASS */
          )
        ]),
        vue.createElementVNode("view", { class: "list mt16" }, [
          vue.createElementVNode("view", {
            class: "li",
            onClick: _cache[3] || (_cache[3] = ($event) => $setup.showLocation = true)
          }, [
            vue.createElementVNode("text", { class: "lb" }, "地点"),
            vue.createElementVNode(
              "text",
              { class: "vl el" },
              vue.toDisplayString($setup.form.location || "未填写"),
              1
              /* TEXT */
            ),
            vue.createElementVNode("text", { class: "chev" }, "›")
          ]),
          vue.createElementVNode("view", { class: "li" }, [
            vue.createElementVNode("text", { class: "lb" }, "关联档案项"),
            vue.createElementVNode(
              "text",
              { class: "vl" },
              vue.toDisplayString($setup.elderName) + " · " + vue.toDisplayString($setup.elderCondition),
              1
              /* TEXT */
            )
          ]),
          vue.createElementVNode("picker", {
            mode: "selector",
            range: $setup.remindOptions,
            value: $setup.remindIndex,
            onChange: $setup.onRemind
          }, [
            vue.createElementVNode("view", { class: "li" }, [
              vue.createElementVNode("text", { class: "lb" }, "提醒"),
              vue.createElementVNode(
                "text",
                { class: "vl" },
                vue.toDisplayString($setup.form.remindLabel),
                1
                /* TEXT */
              ),
              vue.createElementVNode("text", { class: "chev" }, "›")
            ])
          ], 40, ["range", "value"]),
          vue.createElementVNode("view", { class: "li" }, [
            vue.createElementVNode("view", { class: "f1" }, [
              vue.createElementVNode("text", { class: "lb" }, "标记为紧急"),
              vue.createElementVNode("view", { class: "t11 c3 mt4" }, "可穿透静默时段")
            ]),
            vue.createVNode($setup["JdSwitch"], {
              modelValue: $setup.form.isUrgent,
              "onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => $setup.form.isUrgent = $event)
            }, null, 8, ["modelValue"])
          ]),
          vue.createElementVNode("view", { class: "li" }, [
            vue.createElementVNode("view", { class: "f1" }, [
              vue.createElementVNode("text", { class: "lb" }, "需要我确认"),
              vue.createElementVNode("view", { class: "t11 c3 mt4" }, "责任人提交后由主理确认")
            ]),
            vue.createVNode($setup["JdSwitch"], {
              modelValue: $setup.form.needConfirm,
              "onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => $setup.form.needConfirm = $event)
            }, null, 8, ["modelValue"])
          ])
        ]),
        vue.createElementVNode("view", { class: "card flat mt12 notice" }, [
          vue.createElementVNode("text", {
            class: "t11 c2",
            style: { "line-height": "18px" }
          }, " 重复任务会生成独立实例，某一次可以单独跳过或改时间，不影响其它次。 ")
        ]),
        vue.createElementVNode("view", {
          class: "t11 c3 mt14",
          style: { "line-height": "18px" }
        }, " 参考模板：复查带化验单 · 取药带医保卡 · 体检需空腹 ")
      ]),
      vue.createElementVNode("view", { class: "actionbar" }, [
        vue.createElementVNode("button", {
          class: "btn btn-primary",
          disabled: $setup.submitting,
          onClick: $setup.submit
        }, vue.toDisplayString($setup.submitting ? "正在派发…" : "派发并通知"), 9, ["disabled"])
      ]),
      vue.createVNode(_component_u_popup, {
        show: $setup.showTemplates,
        "onUpdate:show": _cache[6] || (_cache[6] = ($event) => $setup.showTemplates = $event),
        mode: "bottom",
        round: "20",
        safeAreaInsetBottom: true
      }, {
        default: vue.withCtx(() => [
          vue.createElementVNode("view", { class: "pop" }, [
            vue.createElementVNode("view", { class: "pop-title" }, "任务模板"),
            vue.createElementVNode("view", { class: "t11 c3 mb10" }, "模板只是把常做的事填好，具体时间地点还可以改。"),
            vue.createElementVNode("view", { class: "list" }, [
              (vue.openBlock(true), vue.createElementBlock(
                vue.Fragment,
                null,
                vue.renderList($setup.templates, (tpl) => {
                  return vue.openBlock(), vue.createElementBlock("view", {
                    key: tpl.key,
                    class: "li",
                    onClick: ($event) => $setup.applyTemplate(tpl)
                  }, [
                    vue.createElementVNode("view", { class: "f1" }, [
                      vue.createElementVNode(
                        "text",
                        { class: "lb" },
                        vue.toDisplayString(tpl.title),
                        1
                        /* TEXT */
                      ),
                      vue.createElementVNode(
                        "view",
                        { class: "t11 c3 mt4" },
                        vue.toDisplayString(tpl.hint) + " · " + vue.toDisplayString(tpl.location),
                        1
                        /* TEXT */
                      )
                    ]),
                    vue.createElementVNode("text", { class: "chev" }, "›")
                  ], 8, ["onClick"]);
                }),
                128
                /* KEYED_FRAGMENT */
              ))
            ])
          ])
        ]),
        _: 1
        /* STABLE */
      }, 8, ["show"]),
      vue.createVNode(_component_u_popup, {
        show: $setup.showLocation,
        "onUpdate:show": _cache[8] || (_cache[8] = ($event) => $setup.showLocation = $event),
        mode: "bottom",
        round: "20",
        safeAreaInsetBottom: true
      }, {
        default: vue.withCtx(() => [
          vue.createElementVNode("view", { class: "pop" }, [
            vue.createElementVNode("view", { class: "pop-title" }, "地点"),
            vue.createElementVNode("view", { class: "field mt10" }, [
              vue.withDirectives(vue.createElementVNode(
                "input",
                {
                  "onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => $setup.locationDraft = $event),
                  class: "input t15",
                  placeholder: "例如：市一院 3 号楼",
                  "placeholder-class": "ph"
                },
                null,
                512
                /* NEED_PATCH */
              ), [
                [vue.vModelText, $setup.locationDraft]
              ])
            ]),
            vue.createElementVNode("view", { class: "row g6 mt10 wrap" }, [
              (vue.openBlock(), vue.createElementBlock(
                vue.Fragment,
                null,
                vue.renderList($setup.locationOptions, (loc) => {
                  return vue.createElementVNode("view", {
                    key: loc,
                    class: "chip",
                    onClick: ($event) => $setup.pickLocation(loc)
                  }, vue.toDisplayString(loc), 9, ["onClick"]);
                }),
                64
                /* STABLE_FRAGMENT */
              ))
            ]),
            vue.createElementVNode("button", {
              class: "btn btn-primary mt14",
              onClick: $setup.saveLocation
            }, "确定")
          ])
        ]),
        _: 1
        /* STABLE */
      }, 8, ["show"])
    ]);
  }
  const PagesCreateCreate = /* @__PURE__ */ _export_sfc(_sfc_main$b, [["render", _sfc_render$a], ["__scopeId", "data-v-591de917"], ["__file", "D:/workZone/APP/frontend/src/pages/create/create.vue"]]);
  const _sfc_main$a = {
    __name: "detail",
    setup(__props, { expose: __expose }) {
      __expose();
      const session2 = useSession();
      const taskId = vue.ref(0);
      const task = vue.ref(null);
      const members = vue.ref([]);
      const showReassign = vue.ref(false);
      const showComplete = vue.ref(false);
      const showReason = vue.ref(false);
      const reasonMode = vue.ref("cancel");
      const reason = vue.ref("");
      const completeNote = vue.ref("");
      const completeImages = vue.ref([]);
      const submitting = vue.ref(false);
      const ACTIVE = ["pending_claim", "claimed", "in_progress", "pending_confirm", "overdue", "question"];
      const isActive = vue.computed(() => task.value && ACTIVE.includes(task.value.status));
      const dueClock = vue.computed(() => task.value && task.value.dueAt ? task.value.dueAt.slice(11, 16) : "");
      const prettyTime = vue.computed(() => {
        if (!task.value)
          return "";
        return `${task.value.dayLabel} ${task.value.time}`;
      });
      const createdLabel = vue.computed(() => {
        if (!task.value || !task.value.createdAt)
          return "";
        const d = new Date(task.value.createdAt.replace("T", " ").replace(/-/g, "/"));
        const now = /* @__PURE__ */ new Date();
        const d0 = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const n0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const diff = Math.max(0, Math.round((n0 - d0) / 864e5));
        if (diff === 0)
          return "今天";
        if (diff === 1)
          return "昨天";
        return `${diff} 天前`;
      });
      const stateText = vue.computed(() => {
        if (!task.value)
          return "";
        const last = [...task.value.events || []].reverse().find((e) => e.action !== "create");
        if (!last)
          return "等待认领";
        return `${last.note || last.title} · ${last.relative}`;
      });
      const nextStepLabel = vue.computed(() => {
        if (!task.value)
          return "";
        const map = {
          pending_claim: "等待有人认领",
          claimed: "等待开始",
          in_progress: "完成并上传凭证",
          pending_confirm: "等我确认",
          question: "等待回复疑问",
          overdue: "等待补救：改派或取消"
        };
        return map[task.value.status] || "等待中";
      });
      const primaryLabel = vue.computed(() => {
        if (!task.value)
          return "";
        const p = task.value.permissions;
        if (task.value.status === "pending_confirm" && p.canConfirm)
          return "确认完成";
        if (task.value.status === "in_progress" && p.canComplete)
          return "我已完成";
        if ((task.value.status === "claimed" || task.value.status === "overdue") && p.canStart)
          return "开始";
        if (p.canClaim)
          return "认领";
        return "看流水";
      });
      onLoad((query) => {
        taskId.value = Number(query.id || 0);
      });
      vue.onMounted(async () => {
        await load();
        try {
          const meta = await taskApi.meta();
          members.value = meta.members;
        } catch (e) {
        }
      });
      onShow(() => {
        if (taskId.value && session2.token)
          load();
      });
      async function load() {
        try {
          task.value = await taskApi.detail(taskId.value);
        } catch (e) {
        }
      }
      function primaryTap() {
        if (!task.value)
          return;
        const status = task.value.status;
        const p = task.value.permissions || {};
        if (status === "pending_confirm" && p.canConfirm)
          return confirm();
        if (status === "in_progress" && p.canComplete)
          return openComplete();
        if ((status === "claimed" || status === "overdue") && p.canStart)
          return start();
        if (p.canClaim)
          return claim();
        uni.navigateTo({ url: "/pages/timeline/timeline" });
      }
      async function claim() {
        try {
          await taskApi.claim(taskId.value);
          uni.showToast({ title: "已认领，记得去做", icon: "none" });
          load();
        } catch (e) {
        }
      }
      async function start() {
        try {
          await taskApi.start(taskId.value);
          uni.showToast({ title: "已开始，安心去做", icon: "none" });
          load();
        } catch (e) {
        }
      }
      function openComplete() {
        completeNote.value = "";
        completeImages.value = [];
        showComplete.value = true;
      }
      async function complete() {
        if (submitting.value)
          return;
        submitting.value = true;
        try {
          const uploaded = [];
          for (const img of completeImages.value) {
            const url2 = await uploadEvidence(img);
            if (url2)
              uploaded.push({ kind: "image", url: url2 });
          }
          if (completeImages.value.length && uploaded.length !== completeImages.value.length) {
            uni.showToast({ title: "凭证上传失败，请重试", icon: "none" });
            return;
          }
          const res = await taskApi.complete(taskId.value, {
            note: completeNote.value || "已完成",
            attachments: uploaded
          });
          showComplete.value = false;
          uni.showToast({ title: res.msg || "已提交，等待确认", icon: "none" });
          load();
        } catch (e) {
        } finally {
          submitting.value = false;
        }
      }
      async function confirm() {
        try {
          const res = await taskApi.confirm(taskId.value, { note: "主理已确认" });
          uni.showToast({ title: res.msg || "已确认完成", icon: "none" });
          load();
        } catch (e) {
        }
      }
      async function remind() {
        try {
          await taskApi.remind(taskId.value);
          uni.showToast({ title: "已提醒责任人", icon: "none" });
          load();
        } catch (e) {
        }
      }
      async function reassign(member) {
        try {
          await taskApi.reassign(taskId.value, { assigneeId: member.userId, reason: `改派给${member.name}` });
          showReassign.value = false;
          uni.showToast({ title: `已改派给${member.name}`, icon: "none" });
          load();
        } catch (e) {
        }
      }
      function openMore() {
        const p = task.value ? task.value.permissions : {};
        const items = ["看照护流水"];
        if (p.canCancel)
          items.push("取消并说明");
        if (p.canSkip)
          items.push("跳过本次");
        if (p.canAsk)
          items.push("对这件事有疑问");
        uni.showActionSheet({
          itemList: items,
          success: ({ tapIndex }) => {
            const label = items[tapIndex];
            if (label === "看照护流水") {
              uni.navigateTo({ url: "/pages/timeline/timeline" });
            } else if (label === "取消并说明") {
              reasonMode.value = "cancel";
              reason.value = "";
              showReason.value = true;
            } else if (label === "跳过本次") {
              skip();
            } else if (label === "对这件事有疑问") {
              reasonMode.value = "question";
              reason.value = "";
              showReason.value = true;
            }
          }
        });
      }
      async function skip() {
        try {
          await taskApi.skip(taskId.value, { note: "跳过本次（重复任务，不影响其它次）" });
          uni.showToast({ title: "已跳过本次", icon: "none" });
          load();
        } catch (e) {
        }
      }
      async function submitReason() {
        if (!reason.value.trim()) {
          uni.showToast({ title: "请写一句原因", icon: "none" });
          return;
        }
        try {
          if (reasonMode.value === "cancel") {
            await taskApi.cancel(taskId.value, { reason: reason.value.trim() });
          } else {
            await taskApi.question(taskId.value, { note: reason.value.trim() });
          }
          showReason.value = false;
          uni.showToast({ title: "已记录", icon: "none" });
          load();
        } catch (e) {
        }
      }
      function chooseCompleteImage() {
        uni.chooseImage({
          count: 3,
          success: (res) => {
            completeImages.value = completeImages.value.concat(res.tempFilePaths).slice(0, 3);
          }
        });
      }
      function chooseEvidence() {
        uni.chooseImage({
          count: 3,
          success: async (res) => {
            for (const path of res.tempFilePaths) {
              const url2 = await uploadEvidence(path);
              if (url2)
                uni.showToast({ title: "凭证已上传", icon: "none" });
            }
            load();
          }
        });
      }
      async function uploadEvidence(filePath) {
        try {
          const data = await upload({
            url: `/api/tasks/${taskId.value}/attachments`,
            filePath,
            formData: { kind: "image" }
          });
          return data && data.url ? data.url : "";
        } catch (e) {
          return "";
        }
      }
      function previewImage(url2) {
        uni.previewImage({ urls: [assetUrl(url2)] });
      }
      function previewLocal(path) {
        uni.previewImage({ urls: [path] });
      }
      const __returned__ = { session: session2, taskId, task, members, showReassign, showComplete, showReason, reasonMode, reason, completeNote, completeImages, submitting, ACTIVE, isActive, dueClock, prettyTime, createdLabel, stateText, nextStepLabel, primaryLabel, load, primaryTap, claim, start, openComplete, complete, confirm, remind, reassign, openMore, skip, submitReason, chooseCompleteImage, chooseEvidence, uploadEvidence, previewImage, previewLocal, ref: vue.ref, computed: vue.computed, onMounted: vue.onMounted, get onLoad() {
        return onLoad;
      }, get onShow() {
        return onShow;
      }, JdNav, JdStatus, JdAvatar, JdIcon, get taskApi() {
        return taskApi;
      }, get assetUrl() {
        return assetUrl;
      }, get upload() {
        return upload;
      }, get useSession() {
        return useSession;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$9(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_u_popup = resolveEasycom(vue.resolveDynamicComponent("u-popup"), __easycom_0$1);
    return vue.openBlock(), vue.createElementBlock("view", { class: "jd-page" }, [
      vue.createVNode($setup["JdNav"], {
        title: "任务详情",
        back: "",
        action: "···",
        onAction: $setup.openMore
      }),
      $setup.task ? (vue.openBlock(), vue.createElementBlock("scroll-view", {
        key: 0,
        class: "jd-body scroll",
        "scroll-y": "",
        "show-scrollbar": false
      }, [
        vue.createElementVNode("view", { class: "row g6 mt6" }, [
          vue.createVNode($setup["JdStatus"], {
            label: $setup.task.statusLabel,
            tone: $setup.task.tone
          }, null, 8, ["label", "tone"]),
          vue.createElementVNode(
            "view",
            { class: "tag" },
            vue.toDisplayString($setup.task.category),
            1
            /* TEXT */
          ),
          vue.createElementVNode(
            "text",
            { class: "t11 c3" },
            "创建 " + vue.toDisplayString($setup.createdLabel),
            1
            /* TEXT */
          )
        ]),
        vue.createElementVNode(
          "text",
          { class: "t20 b mt10 title" },
          vue.toDisplayString($setup.task.title),
          1
          /* TEXT */
        ),
        vue.createElementVNode("view", { class: "card tight mt12" }, [
          vue.createElementVNode("view", { class: "row g12 info-row" }, [
            vue.createElementVNode("text", { class: "t12 c3 info-label" }, "时间"),
            vue.createElementVNode(
              "text",
              { class: "t13 sb num" },
              vue.toDisplayString($setup.prettyTime),
              1
              /* TEXT */
            )
          ]),
          vue.createElementVNode("view", { class: "row g12 info-row" }, [
            vue.createElementVNode("text", { class: "t12 c3 info-label" }, "谁去"),
            $setup.task.assignee ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 0,
              class: "row g6"
            }, [
              vue.createVNode($setup["JdAvatar"], {
                text: $setup.task.assignee.avatarText,
                color: $setup.task.assignee.avatarColor,
                size: "sm"
              }, null, 8, ["text", "color"]),
              vue.createElementVNode(
                "text",
                { class: "t13" },
                vue.toDisplayString($setup.task.assignee.name),
                1
                /* TEXT */
              )
            ])) : (vue.openBlock(), vue.createElementBlock("text", {
              key: 1,
              class: "t13 c2"
            }, "待认领 · 已发到家庭组"))
          ]),
          vue.createElementVNode("view", { class: "row g12 info-row" }, [
            vue.createElementVNode("text", { class: "t12 c3 info-label" }, "状态"),
            vue.createElementVNode(
              "text",
              { class: "t13 c2" },
              vue.toDisplayString($setup.stateText),
              1
              /* TEXT */
            )
          ]),
          $setup.task.location ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "row g12 info-row"
          }, [
            vue.createElementVNode("text", { class: "t12 c3 info-label" }, "地点"),
            vue.createElementVNode(
              "text",
              { class: "t13 c2" },
              vue.toDisplayString($setup.task.location),
              1
              /* TEXT */
            )
          ])) : vue.createCommentVNode("v-if", true)
        ]),
        $setup.isActive ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "card flat tight mt8 countdown"
        }, [
          vue.createElementVNode("view", { class: "between" }, [
            vue.createElementVNode(
              "text",
              { class: "t12 sb cbrand" },
              "截止 " + vue.toDisplayString($setup.dueClock) + " 前完成",
              1
              /* TEXT */
            ),
            vue.createElementVNode(
              "text",
              { class: "t12 c2 num" },
              vue.toDisplayString($setup.task.remaining),
              1
              /* TEXT */
            )
          ]),
          vue.createElementVNode(
            "view",
            {
              class: vue.normalizeClass(["bar mt8", { danger: $setup.task.progress <= 50 }])
            },
            [
              vue.createElementVNode(
                "i",
                {
                  style: vue.normalizeStyle({ width: Math.max(2, $setup.task.progress) + "%" })
                },
                null,
                4
                /* STYLE */
              )
            ],
            2
            /* CLASS */
          ),
          vue.createElementVNode(
            "view",
            {
              class: "t11 c3 mt8",
              style: { "line-height": "17px" }
            },
            vue.toDisplayString($setup.task.reminderPlan),
            1
            /* TEXT */
          )
        ])) : vue.createCommentVNode("v-if", true),
        vue.createElementVNode("view", { class: "t12 c2 sb mt16 mb8" }, "进度"),
        vue.createElementVNode("view", { class: "tl" }, [
          (vue.openBlock(true), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($setup.task.events, (e) => {
              return vue.openBlock(), vue.createElementBlock(
                "view",
                {
                  key: e.id,
                  class: vue.normalizeClass(["tl-i", e.tone])
                },
                [
                  vue.createElementVNode("view", { class: "between" }, [
                    vue.createElementVNode(
                      "text",
                      { class: "t13 sb" },
                      vue.toDisplayString(e.title),
                      1
                      /* TEXT */
                    ),
                    vue.createElementVNode(
                      "text",
                      { class: "t11 c3 num" },
                      vue.toDisplayString(e.relative),
                      1
                      /* TEXT */
                    )
                  ]),
                  e.note ? (vue.openBlock(), vue.createElementBlock(
                    "view",
                    {
                      key: 0,
                      class: "t11 c3 mt4"
                    },
                    vue.toDisplayString(e.note),
                    1
                    /* TEXT */
                  )) : vue.createCommentVNode("v-if", true)
                ],
                2
                /* CLASS */
              );
            }),
            128
            /* KEYED_FRAGMENT */
          )),
          $setup.isActive ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "tl-i on"
          }, [
            vue.createElementVNode("view", { class: "between" }, [
              vue.createElementVNode(
                "text",
                { class: "t13 sb" },
                vue.toDisplayString($setup.nextStepLabel),
                1
                /* TEXT */
              ),
              vue.createElementVNode("text", { class: "t11 c3" }, "等待中")
            ])
          ])) : vue.createCommentVNode("v-if", true)
        ]),
        vue.createElementVNode("view", { class: "t12 c2 sb mt14 mb8" }, "凭证"),
        vue.createElementVNode("view", { class: "row g8 wrap" }, [
          (vue.openBlock(true), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($setup.task.attachments, (att) => {
              return vue.openBlock(), vue.createElementBlock("image", {
                key: att.id,
                class: "thumb",
                src: $setup.assetUrl(att.url),
                mode: "aspectFill",
                onClick: ($event) => $setup.previewImage(att.url)
              }, null, 8, ["src", "onClick"]);
            }),
            128
            /* KEYED_FRAGMENT */
          )),
          $setup.task.permissions.canUpload ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "thumb add",
            onClick: $setup.chooseEvidence
          }, [
            vue.createVNode($setup["JdIcon"], {
              name: "plus",
              size: 18,
              color: "#A99D91"
            })
          ])) : vue.createCommentVNode("v-if", true),
          !$setup.task.attachments.length && !$setup.task.permissions.canUpload ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 1,
            class: "t11 c3"
          }, " 暂无凭证（长辈端豁免） ")) : vue.createCommentVNode("v-if", true)
        ]),
        $setup.task.description ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 1,
          class: "card flat tight mt12"
        }, [
          vue.createElementVNode("view", { class: "t11 c3" }, "备注"),
          vue.createElementVNode(
            "view",
            { class: "t13 c2 mt4" },
            vue.toDisplayString($setup.task.description),
            1
            /* TEXT */
          )
        ])) : vue.createCommentVNode("v-if", true),
        vue.createElementVNode("view", { class: "disc mt14" }, " 凭证只读展示，上传由责任人完成，主理不能代传——这样记录才可信。 ")
      ])) : vue.createCommentVNode("v-if", true),
      $setup.task ? (vue.openBlock(), vue.createElementBlock("view", {
        key: 1,
        class: "actionbar"
      }, [
        $setup.task.permissions.canReassign ? (vue.openBlock(), vue.createElementBlock("button", {
          key: 0,
          class: "btn btn-ghost flex-btn",
          onClick: _cache[0] || (_cache[0] = ($event) => $setup.showReassign = true)
        }, "改派")) : vue.createCommentVNode("v-if", true),
        $setup.task.permissions.canRemind ? (vue.openBlock(), vue.createElementBlock("button", {
          key: 1,
          class: "btn btn-sunk flex-btn",
          onClick: $setup.remind
        }, "提醒")) : vue.createCommentVNode("v-if", true),
        vue.createElementVNode(
          "button",
          {
            class: "btn btn-primary flex-primary",
            onClick: $setup.primaryTap
          },
          vue.toDisplayString($setup.primaryLabel),
          1
          /* TEXT */
        )
      ])) : vue.createCommentVNode("v-if", true),
      vue.createVNode(_component_u_popup, {
        show: $setup.showReassign,
        "onUpdate:show": _cache[1] || (_cache[1] = ($event) => $setup.showReassign = $event),
        mode: "bottom",
        round: "20",
        safeAreaInsetBottom: true
      }, {
        default: vue.withCtx(() => [
          vue.createElementVNode("view", { class: "pop" }, [
            vue.createElementVNode("view", { class: "pop-title" }, "改派给谁"),
            vue.createElementVNode("view", { class: "t11 c3 mb10" }, "改派会通知新责任人，并写进照护流水。"),
            vue.createElementVNode("view", { class: "list" }, [
              (vue.openBlock(true), vue.createElementBlock(
                vue.Fragment,
                null,
                vue.renderList($setup.members, (m) => {
                  return vue.openBlock(), vue.createElementBlock("view", {
                    key: m.userId,
                    class: "li",
                    onClick: ($event) => $setup.reassign(m)
                  }, [
                    vue.createVNode($setup["JdAvatar"], {
                      text: m.avatarText,
                      color: m.avatarColor,
                      size: "sm"
                    }, null, 8, ["text", "color"]),
                    vue.createElementVNode("view", { class: "f1" }, [
                      vue.createElementVNode(
                        "text",
                        { class: "lb" },
                        vue.toDisplayString(m.name),
                        1
                        /* TEXT */
                      ),
                      vue.createElementVNode(
                        "view",
                        { class: "t11 c3 mt2" },
                        vue.toDisplayString(m.relation),
                        1
                        /* TEXT */
                      )
                    ]),
                    vue.createElementVNode("text", { class: "chev" }, "›")
                  ], 8, ["onClick"]);
                }),
                128
                /* KEYED_FRAGMENT */
              ))
            ])
          ])
        ]),
        _: 1
        /* STABLE */
      }, 8, ["show"]),
      vue.createVNode(_component_u_popup, {
        show: $setup.showComplete,
        "onUpdate:show": _cache[3] || (_cache[3] = ($event) => $setup.showComplete = $event),
        mode: "bottom",
        round: "20",
        safeAreaInsetBottom: true
      }, {
        default: vue.withCtx(() => [
          vue.createElementVNode("view", { class: "pop" }, [
            vue.createElementVNode("view", { class: "pop-title" }, "完成并提交"),
            vue.createElementVNode("view", { class: "field mt8" }, [
              vue.createElementVNode("view", { class: "lab" }, "说明（可选）"),
              vue.withDirectives(vue.createElementVNode(
                "textarea",
                {
                  "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => $setup.completeNote = $event),
                  class: "textarea",
                  placeholder: "例如：血压 138/86，已记录",
                  "placeholder-class": "ph"
                },
                null,
                512
                /* NEED_PATCH */
              ), [
                [vue.vModelText, $setup.completeNote]
              ])
            ]),
            vue.createElementVNode("view", { class: "row g8 mt10" }, [
              (vue.openBlock(true), vue.createElementBlock(
                vue.Fragment,
                null,
                vue.renderList($setup.completeImages, (img, i) => {
                  return vue.openBlock(), vue.createElementBlock("view", {
                    key: i,
                    class: "thumb",
                    onClick: ($event) => $setup.previewLocal(img)
                  }, [
                    vue.createElementVNode("image", {
                      src: img,
                      mode: "aspectFill",
                      class: "thumb-img"
                    }, null, 8, ["src"])
                  ], 8, ["onClick"]);
                }),
                128
                /* KEYED_FRAGMENT */
              )),
              vue.createElementVNode("view", {
                class: "thumb add",
                onClick: $setup.chooseCompleteImage
              }, [
                vue.createVNode($setup["JdIcon"], {
                  name: "plus",
                  size: 18,
                  color: "#A99D91"
                })
              ])
            ]),
            vue.createElementVNode("button", {
              class: "btn btn-primary mt14",
              disabled: $setup.submitting,
              onClick: $setup.complete
            }, "提交完成", 8, ["disabled"])
          ])
        ]),
        _: 1
        /* STABLE */
      }, 8, ["show"]),
      vue.createVNode(_component_u_popup, {
        show: $setup.showReason,
        "onUpdate:show": _cache[5] || (_cache[5] = ($event) => $setup.showReason = $event),
        mode: "bottom",
        round: "20",
        safeAreaInsetBottom: true
      }, {
        default: vue.withCtx(() => [
          vue.createElementVNode("view", { class: "pop" }, [
            vue.createElementVNode(
              "view",
              { class: "pop-title" },
              vue.toDisplayString($setup.reasonMode === "cancel" ? "取消并说明" : "有什么疑问"),
              1
              /* TEXT */
            ),
            vue.createElementVNode(
              "view",
              { class: "t11 c3 mb10" },
              vue.toDisplayString($setup.reasonMode === "cancel" ? "取消不会删除记录，原因会留在流水里。" : "疑问会通知创建人，记录同样保留。"),
              1
              /* TEXT */
            ),
            vue.createElementVNode("view", { class: "field" }, [
              vue.withDirectives(vue.createElementVNode(
                "textarea",
                {
                  "onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => $setup.reason = $event),
                  class: "textarea",
                  placeholder: "写一句原因，让对方知道发生了什么",
                  "placeholder-class": "ph"
                },
                null,
                512
                /* NEED_PATCH */
              ), [
                [vue.vModelText, $setup.reason]
              ])
            ]),
            vue.createElementVNode("button", {
              class: "btn btn-primary mt14",
              onClick: $setup.submitReason
            }, "提交")
          ])
        ]),
        _: 1
        /* STABLE */
      }, 8, ["show"])
    ]);
  }
  const PagesDetailDetail = /* @__PURE__ */ _export_sfc(_sfc_main$a, [["render", _sfc_render$9], ["__scopeId", "data-v-9cb6f745"], ["__file", "D:/workZone/APP/frontend/src/pages/detail/detail.vue"]]);
  const _sfc_main$9 = {
    __name: "timeline",
    setup(__props, { expose: __expose }) {
      __expose();
      const session2 = useSession();
      const groups = vue.ref([]);
      const filters = vue.ref([]);
      const filter = vue.ref("all");
      const page2 = vue.ref(1);
      const hasMore = vue.ref(false);
      const loading = vue.ref(true);
      const loadingMore = vue.ref(false);
      const members = vue.ref([]);
      const showReassign = vue.ref(false);
      const showCancel = vue.ref(false);
      const activeTaskId = vue.ref(0);
      const cancelReason = vue.ref("");
      vue.onMounted(async () => {
        await load(true);
        try {
          const meta = await taskApi.meta();
          members.value = meta.members;
        } catch (e) {
        }
      });
      onShow(() => {
        if (session2.token)
          load(true);
      });
      function mergeGroups(prev, next) {
        const map = /* @__PURE__ */ new Map();
        prev.forEach((g) => map.set(g.date, { ...g, items: [...g.items] }));
        next.forEach((g) => {
          const hit = map.get(g.date);
          if (hit) {
            hit.items = hit.items.concat(g.items);
            hit.count = hit.items.length;
          } else {
            map.set(g.date, { ...g, items: [...g.items] });
          }
        });
        return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
      }
      async function load(reset = false) {
        if (reset) {
          page2.value = 1;
          loading.value = true;
          loadingMore.value = false;
        }
        try {
          const res = await timelineApi.list({ filter: filter.value, page: page2.value, pageSize: 20 });
          filters.value = res.filters;
          hasMore.value = res.hasMore;
          groups.value = reset ? res.groups : mergeGroups(groups.value, res.groups);
        } catch (e) {
          if (!reset)
            page2.value = Math.max(1, page2.value - 1);
        } finally {
          loading.value = false;
          loadingMore.value = false;
        }
      }
      function setFilter(key) {
        filter.value = key;
        load(true);
      }
      function loadMore() {
        if (loadingMore.value || !hasMore.value)
          return;
        loadingMore.value = true;
        page2.value += 1;
        load(false);
      }
      function preview(url2) {
        uni.previewImage({ urls: [assetUrl(url2)] });
      }
      function openReassign(item) {
        if (!item.taskId)
          return;
        activeTaskId.value = item.taskId;
        showReassign.value = true;
      }
      function openCancel(item) {
        if (!item.taskId)
          return;
        activeTaskId.value = item.taskId;
        cancelReason.value = "";
        showCancel.value = true;
      }
      async function doReassign(member) {
        try {
          await taskApi.reassign(activeTaskId.value, { assigneeId: member.userId, reason: `超时后改派给${member.name}` });
          showReassign.value = false;
          uni.showToast({ title: `已改派给${member.name}`, icon: "none" });
          load(true);
        } catch (e) {
        }
      }
      async function doCancel() {
        if (!cancelReason.value.trim()) {
          uni.showToast({ title: "请写一句原因", icon: "none" });
          return;
        }
        try {
          await taskApi.cancel(activeTaskId.value, { reason: cancelReason.value.trim() });
          showCancel.value = false;
          uni.showToast({ title: "已取消并说明", icon: "none" });
          load(true);
        } catch (e) {
        }
      }
      function go2(url2) {
        uni.navigateTo({ url: url2 });
      }
      const __returned__ = { session: session2, groups, filters, filter, page: page2, hasMore, loading, loadingMore, members, showReassign, showCancel, activeTaskId, cancelReason, mergeGroups, load, setFilter, loadMore, preview, openReassign, openCancel, doReassign, doCancel, go: go2, ref: vue.ref, onMounted: vue.onMounted, get onShow() {
        return onShow;
      }, JdNav, JdTabbar, JdAvatar, JdIcon, get taskApi() {
        return taskApi;
      }, get timelineApi() {
        return timelineApi;
      }, get assetUrl() {
        return assetUrl;
      }, get useSession() {
        return useSession;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$8(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_u_popup = resolveEasycom(vue.resolveDynamicComponent("u-popup"), __easycom_0$1);
    return vue.openBlock(), vue.createElementBlock("view", { class: "jd-page" }, [
      vue.createVNode($setup["JdNav"], {
        title: "流水",
        action: "导出",
        onAction: _cache[0] || (_cache[0] = ($event) => $setup.go("/pages/export/export"))
      }),
      vue.createElementVNode("scroll-view", {
        class: "jd-body scroll",
        "scroll-y": "",
        "show-scrollbar": false
      }, [
        vue.createElementVNode("view", { class: "row g8 wrap mt6" }, [
          (vue.openBlock(true), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($setup.filters, (f) => {
              return vue.openBlock(), vue.createElementBlock("view", {
                key: f.key,
                class: vue.normalizeClass(["chip", { on: $setup.filter === f.key }]),
                onClick: ($event) => $setup.setFilter(f.key)
              }, vue.toDisplayString(f.label) + " " + vue.toDisplayString(f.count), 11, ["onClick"]);
            }),
            128
            /* KEYED_FRAGMENT */
          ))
        ]),
        vue.createElementVNode("view", { class: "notice-bar mt10" }, [
          vue.createVNode($setup["JdIcon"], {
            name: "lock",
            size: 14,
            color: "#7A6E63"
          }),
          vue.createElementVNode("text", null, "只增不改 · 不可删除 · 支持导出 PDF 给医生")
        ]),
        !$setup.loading && !$setup.groups.length ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "empty"
        }, [
          vue.createElementVNode("view", { class: "ic" }, "📜"),
          vue.createElementVNode("view", { class: "t13" }, "还没有这类记录")
        ])) : vue.createCommentVNode("v-if", true),
        (vue.openBlock(true), vue.createElementBlock(
          vue.Fragment,
          null,
          vue.renderList($setup.groups, (group) => {
            return vue.openBlock(), vue.createElementBlock("view", {
              key: group.date
            }, [
              vue.createElementVNode("view", { class: "between mt16 mb6" }, [
                vue.createElementVNode(
                  "text",
                  { class: "t12 c2 sb" },
                  vue.toDisplayString(group.dateLabel),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode(
                  "text",
                  { class: "t11 c3" },
                  vue.toDisplayString(group.count) + " 条",
                  1
                  /* TEXT */
                )
              ]),
              vue.createElementVNode("view", { class: "tl" }, [
                (vue.openBlock(true), vue.createElementBlock(
                  vue.Fragment,
                  null,
                  vue.renderList(group.items, (item) => {
                    return vue.openBlock(), vue.createElementBlock(
                      "view",
                      {
                        key: item.id,
                        class: vue.normalizeClass(["tl-i", item.tone])
                      },
                      [
                        vue.createElementVNode("view", { class: "between" }, [
                          vue.createElementVNode(
                            "text",
                            { class: "t13 sb" },
                            vue.toDisplayString(item.title),
                            1
                            /* TEXT */
                          ),
                          vue.createElementVNode(
                            "text",
                            { class: "t11 c3 num" },
                            vue.toDisplayString(item.time),
                            1
                            /* TEXT */
                          )
                        ]),
                        item.note ? (vue.openBlock(), vue.createElementBlock(
                          "view",
                          {
                            key: 0,
                            class: "t11 c3 mt4"
                          },
                          vue.toDisplayString(item.note),
                          1
                          /* TEXT */
                        )) : vue.createCommentVNode("v-if", true),
                        item.attachments && item.attachments.length ? (vue.openBlock(), vue.createElementBlock("view", {
                          key: 1,
                          class: "row g6 mt8"
                        }, [
                          (vue.openBlock(true), vue.createElementBlock(
                            vue.Fragment,
                            null,
                            vue.renderList(item.attachments.slice(0, 3), (att) => {
                              return vue.openBlock(), vue.createElementBlock("image", {
                                key: att.id,
                                class: "mini-thumb",
                                src: $setup.assetUrl(att.url),
                                mode: "aspectFill",
                                onClick: ($event) => $setup.preview(att.url)
                              }, null, 8, ["src", "onClick"]);
                            }),
                            128
                            /* KEYED_FRAGMENT */
                          ))
                        ])) : vue.createCommentVNode("v-if", true),
                        item.canReassign || item.canCancel ? (vue.openBlock(), vue.createElementBlock("view", {
                          key: 2,
                          class: "row g8 mt8"
                        }, [
                          item.canReassign ? (vue.openBlock(), vue.createElementBlock("button", {
                            key: 0,
                            class: "btn btn-ghost btn-sm",
                            onClick: ($event) => $setup.openReassign(item)
                          }, "改派", 8, ["onClick"])) : vue.createCommentVNode("v-if", true),
                          item.canCancel ? (vue.openBlock(), vue.createElementBlock("button", {
                            key: 1,
                            class: "btn btn-ghost btn-sm",
                            onClick: ($event) => $setup.openCancel(item)
                          }, "取消并说明", 8, ["onClick"])) : vue.createCommentVNode("v-if", true)
                        ])) : vue.createCommentVNode("v-if", true)
                      ],
                      2
                      /* CLASS */
                    );
                  }),
                  128
                  /* KEYED_FRAGMENT */
                ))
              ])
            ]);
          }),
          128
          /* KEYED_FRAGMENT */
        )),
        $setup.hasMore ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 1,
          class: "tc mt16"
        }, [
          vue.createElementVNode("button", {
            class: "btn btn-ghost btn-auto",
            onClick: $setup.loadMore
          }, "加载更多")
        ])) : vue.createCommentVNode("v-if", true),
        vue.createElementVNode("view", { class: "disc mt18" }, " 异常条目保留补救动作，但不允许删除记录本身。导出会把这次行为也写进流水。 ")
      ]),
      vue.createVNode($setup["JdTabbar"], { active: "timeline" }),
      vue.createVNode(_component_u_popup, {
        show: $setup.showReassign,
        "onUpdate:show": _cache[1] || (_cache[1] = ($event) => $setup.showReassign = $event),
        mode: "bottom",
        round: "20",
        safeAreaInsetBottom: true
      }, {
        default: vue.withCtx(() => [
          vue.createElementVNode("view", { class: "pop" }, [
            vue.createElementVNode("view", { class: "pop-title" }, "改派给谁"),
            vue.createElementVNode("view", { class: "list mt10" }, [
              (vue.openBlock(true), vue.createElementBlock(
                vue.Fragment,
                null,
                vue.renderList($setup.members, (m) => {
                  return vue.openBlock(), vue.createElementBlock("view", {
                    key: m.userId,
                    class: "li",
                    onClick: ($event) => $setup.doReassign(m)
                  }, [
                    vue.createVNode($setup["JdAvatar"], {
                      text: m.avatarText,
                      color: m.avatarColor,
                      size: "sm"
                    }, null, 8, ["text", "color"]),
                    vue.createElementVNode("view", { class: "f1" }, [
                      vue.createElementVNode(
                        "text",
                        { class: "lb" },
                        vue.toDisplayString(m.name),
                        1
                        /* TEXT */
                      ),
                      vue.createElementVNode(
                        "view",
                        { class: "t11 c3 mt2" },
                        vue.toDisplayString(m.relation),
                        1
                        /* TEXT */
                      )
                    ]),
                    vue.createElementVNode("text", { class: "chev" }, "›")
                  ], 8, ["onClick"]);
                }),
                128
                /* KEYED_FRAGMENT */
              ))
            ])
          ])
        ]),
        _: 1
        /* STABLE */
      }, 8, ["show"]),
      vue.createVNode(_component_u_popup, {
        show: $setup.showCancel,
        "onUpdate:show": _cache[3] || (_cache[3] = ($event) => $setup.showCancel = $event),
        mode: "bottom",
        round: "20",
        safeAreaInsetBottom: true
      }, {
        default: vue.withCtx(() => [
          vue.createElementVNode("view", { class: "pop" }, [
            vue.createElementVNode("view", { class: "pop-title" }, "取消并说明"),
            vue.createElementVNode("view", { class: "t11 c3 mb10" }, "记录不会删除，原因会保留在流水里。"),
            vue.createElementVNode("view", { class: "field" }, [
              vue.withDirectives(vue.createElementVNode(
                "textarea",
                {
                  "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => $setup.cancelReason = $event),
                  class: "textarea",
                  placeholder: "例如：已经改由社区代取，这次不需要了",
                  "placeholder-class": "ph"
                },
                null,
                512
                /* NEED_PATCH */
              ), [
                [vue.vModelText, $setup.cancelReason]
              ])
            ]),
            vue.createElementVNode("button", {
              class: "btn btn-primary mt14",
              onClick: $setup.doCancel
            }, "提交")
          ])
        ]),
        _: 1
        /* STABLE */
      }, 8, ["show"])
    ]);
  }
  const PagesTimelineTimeline = /* @__PURE__ */ _export_sfc(_sfc_main$9, [["render", _sfc_render$8], ["__scopeId", "data-v-7895ef6e"], ["__file", "D:/workZone/APP/frontend/src/pages/timeline/timeline.vue"]]);
  const _sfc_main$8 = {
    __name: "export",
    setup(__props, { expose: __expose }) {
      __expose();
      const session2 = useSession();
      const pad = (n) => String(n).padStart(2, "0");
      const now = /* @__PURE__ */ new Date();
      const monthStart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
      const monthEnd = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate())}`;
      const scope = vue.ref("month");
      const start = vue.ref(monthStart);
      const end = vue.ref(monthEnd);
      const onlyAbnormal = vue.ref(false);
      const includeTasks = vue.ref(true);
      const includeEvidence = vue.ref(true);
      const includeProfile = vue.ref(true);
      const hideNames = vue.ref(false);
      const preview = vue.ref(null);
      const generating = vue.ref(false);
      const showResult = vue.ref(false);
      const result = vue.ref(null);
      const familyName = vue.computed(() => session2.family ? session2.family.name : "家");
      const pdfMonth = vue.computed(() => scope.value === "month" ? `${now.getFullYear()}.${pad(now.getMonth() + 1)}` : `${start.value.slice(5)}`);
      const startLabel = vue.computed(() => start.value.slice(5).replace("-", "/"));
      const endLabel = vue.computed(() => end.value.slice(5).replace("-", "/"));
      const canExport = vue.computed(() => !preview.value || preview.value.canExport);
      const quotaText = vue.computed(() => {
        if (!preview.value)
          return "";
        const q = preview.value.quota.exports;
        if (q.limit < 0)
          return "家庭会员权益 · 本月导出不限次";
        return `家庭会员权益 · 本月还可导出 ${q.left} 次`;
      });
      vue.onMounted(refreshPreview);
      function setScope(value) {
        scope.value = value;
        refreshPreview();
      }
      function onRange(key, e) {
        if (key === "start")
          start.value = e.detail.value;
        else
          end.value = e.detail.value;
        scope.value = "custom";
        refreshPreview();
      }
      let previewSeq = 0;
      async function refreshPreview() {
        const seq = ++previewSeq;
        try {
          const res = await exportApi.preview({
            scope: scope.value,
            start: scope.value === "custom" ? start.value : "",
            end: scope.value === "custom" ? end.value : "",
            onlyAbnormal: onlyAbnormal.value
          });
          if (seq === previewSeq)
            preview.value = res;
        } catch (e) {
        }
      }
      async function generate() {
        if (generating.value)
          return;
        generating.value = true;
        uni.showLoading({ title: "正在生成 PDF…", mask: true });
        try {
          result.value = await exportApi.create({
            scope: scope.value,
            start: scope.value === "custom" ? start.value : "",
            end: scope.value === "custom" ? end.value : "",
            onlyAbnormal: onlyAbnormal.value,
            includeEvidence: includeEvidence.value,
            includeProfile: includeProfile.value,
            hideNames: hideNames.value
          });
          showResult.value = true;
          refreshPreview();
        } catch (e) {
        } finally {
          uni.hideLoading();
          generating.value = false;
        }
      }
      function fullUrl2(url2) {
        return assetUrl(url2);
      }
      function download() {
        if (!result.value)
          return;
        const url2 = fullUrl2(result.value.url);
        uni.downloadFile({
          url: url2,
          success: (res) => {
            if (res.statusCode === 200) {
              uni.openDocument({ filePath: res.tempFilePath, fileType: "pdf", showMenu: true });
            }
          }
        });
      }
      function copyLink() {
        uni.setClipboardData({
          data: fullUrl2(result.value.url),
          success: () => uni.showToast({ title: "链接已复制", icon: "none" })
        });
      }
      function go2(url2) {
        uni.navigateTo({ url: url2 });
      }
      const __returned__ = { session: session2, pad, now, monthStart, monthEnd, scope, start, end, onlyAbnormal, includeTasks, includeEvidence, includeProfile, hideNames, preview, generating, showResult, result, familyName, pdfMonth, startLabel, endLabel, canExport, quotaText, setScope, onRange, get previewSeq() {
        return previewSeq;
      }, set previewSeq(v) {
        previewSeq = v;
      }, refreshPreview, generate, fullUrl: fullUrl2, download, copyLink, go: go2, ref: vue.ref, computed: vue.computed, onMounted: vue.onMounted, JdNav, JdSwitch, JdIcon, get exportApi() {
        return exportApi;
      }, get assetUrl() {
        return assetUrl;
      }, get useSession() {
        return useSession;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$7(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_u_popup = resolveEasycom(vue.resolveDynamicComponent("u-popup"), __easycom_0$1);
    return vue.openBlock(), vue.createElementBlock("view", { class: "jd-page" }, [
      vue.createVNode($setup["JdNav"], {
        title: "导出记录",
        back: ""
      }),
      vue.createElementVNode("scroll-view", {
        class: "jd-body scroll",
        "scroll-y": "",
        "show-scrollbar": false
      }, [
        vue.createElementVNode("view", { class: "row g12 mt6" }, [
          vue.createElementVNode("view", { class: "photo pdf-thumb" }, [
            vue.createElementVNode("view", { class: "pdf-inner" }, [
              vue.createElementVNode("text", { class: "t11" }, "照护记录"),
              vue.createElementVNode(
                "text",
                { class: "t11 mt4" },
                vue.toDisplayString($setup.pdfMonth),
                1
                /* TEXT */
              ),
              vue.createElementVNode("view", { class: "pdf-line" }),
              vue.createElementVNode(
                "text",
                { class: "t10" },
                "共 " + vue.toDisplayString($setup.preview ? $setup.preview.eventCount : 0) + " 条",
                1
                /* TEXT */
              )
            ])
          ]),
          vue.createElementVNode("view", { class: "f1" }, [
            vue.createElementVNode(
              "text",
              { class: "t15 sb" },
              vue.toDisplayString($setup.familyName) + " · " + vue.toDisplayString($setup.pdfMonth) + "照护记录",
              1
              /* TEXT */
            ),
            vue.createElementVNode(
              "view",
              { class: "t11 c3 mt6" },
              vue.toDisplayString($setup.preview ? $setup.preview.eventCount : 0) + " 条事件 · " + vue.toDisplayString($setup.preview ? $setup.preview.evidenceCount : 0) + " 份凭证 ",
              1
              /* TEXT */
            ),
            vue.createElementVNode("view", { class: "row g6 mt10 wrap" }, [
              vue.createElementVNode("view", { class: "tag" }, "A4 竖版"),
              vue.createElementVNode("view", { class: "tag" }, "含时间轴"),
              vue.createElementVNode("view", { class: "tag" }, "脱敏可选")
            ]),
            vue.createElementVNode("view", {
              class: "t11 c3 mt10",
              style: { "line-height": "17px" }
            }, " 给医生看时建议只保留「就诊与用药」相关记录。 ")
          ])
        ]),
        vue.createElementVNode("view", { class: "t12 c2 sb mt20 mb8" }, "导出范围"),
        vue.createElementVNode("view", { class: "list" }, [
          vue.createElementVNode("view", {
            class: "li",
            onClick: _cache[0] || (_cache[0] = ($event) => $setup.setScope("month"))
          }, [
            vue.createElementVNode("text", { class: "lb" }, "本月"),
            $setup.scope === "month" ? (vue.openBlock(), vue.createElementBlock("text", {
              key: 0,
              class: "st done ml-auto"
            }, [
              vue.createElementVNode("view", { class: "dot" }),
              vue.createElementVNode("text", null, "已选")
            ])) : (vue.openBlock(), vue.createElementBlock("text", {
              key: 1,
              class: "chev"
            }, "›"))
          ]),
          vue.createElementVNode("view", {
            class: "li",
            onClick: _cache[3] || (_cache[3] = ($event) => $setup.setScope("custom"))
          }, [
            vue.createElementVNode("text", { class: "lb" }, "自定义时间段"),
            vue.createElementVNode("view", { class: "vl row g6" }, [
              vue.createElementVNode("picker", {
                mode: "date",
                value: $setup.start,
                onChange: _cache[1] || (_cache[1] = (e) => $setup.onRange("start", e))
              }, [
                vue.createElementVNode(
                  "text",
                  { class: "num" },
                  vue.toDisplayString($setup.startLabel),
                  1
                  /* TEXT */
                )
              ], 40, ["value"]),
              vue.createElementVNode("text", null, "–"),
              vue.createElementVNode("picker", {
                mode: "date",
                value: $setup.end,
                onChange: _cache[2] || (_cache[2] = (e) => $setup.onRange("end", e))
              }, [
                vue.createElementVNode(
                  "text",
                  { class: "num" },
                  vue.toDisplayString($setup.endLabel),
                  1
                  /* TEXT */
                )
              ], 40, ["value"])
            ]),
            $setup.scope === "custom" ? (vue.openBlock(), vue.createElementBlock("text", {
              key: 0,
              class: "st done ml6"
            }, [
              vue.createElementVNode("view", { class: "dot" }),
              vue.createElementVNode("text", null, "已选")
            ])) : vue.createCommentVNode("v-if", true)
          ]),
          vue.createElementVNode("view", { class: "li" }, [
            vue.createElementVNode("view", { class: "f1" }, [
              vue.createElementVNode("text", { class: "lb" }, "只看异常与超时"),
              vue.createElementVNode("view", { class: "t11 c3 mt4" }, "给医生解释「中间发生了什么」")
            ]),
            vue.createVNode($setup["JdSwitch"], {
              modelValue: $setup.onlyAbnormal,
              "onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => $setup.onlyAbnormal = $event),
              onChange: $setup.refreshPreview
            }, null, 8, ["modelValue"])
          ])
        ]),
        vue.createElementVNode("view", { class: "t12 c2 sb mt20 mb8" }, "包含内容"),
        vue.createElementVNode("view", { class: "list" }, [
          vue.createElementVNode("view", { class: "li" }, [
            vue.createElementVNode("text", { class: "lb" }, "任务与完成时间"),
            vue.createVNode($setup["JdSwitch"], {
              modelValue: $setup.includeTasks,
              "onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => $setup.includeTasks = $event),
              class: "ml-auto",
              disabled: ""
            }, null, 8, ["modelValue"])
          ]),
          vue.createElementVNode("view", { class: "li" }, [
            vue.createElementVNode("text", { class: "lb" }, "凭证照片"),
            vue.createVNode($setup["JdSwitch"], {
              modelValue: $setup.includeEvidence,
              "onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => $setup.includeEvidence = $event),
              class: "ml-auto",
              onChange: $setup.refreshPreview
            }, null, 8, ["modelValue"])
          ]),
          vue.createElementVNode("view", { class: "li" }, [
            vue.createElementVNode("text", { class: "lb" }, "长辈档案摘要"),
            vue.createVNode($setup["JdSwitch"], {
              modelValue: $setup.includeProfile,
              "onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => $setup.includeProfile = $event),
              class: "ml-auto",
              onChange: $setup.refreshPreview
            }, null, 8, ["modelValue"])
          ]),
          vue.createElementVNode("view", { class: "li" }, [
            vue.createElementVNode("view", { class: "f1" }, [
              vue.createElementVNode("text", { class: "lb" }, "隐藏家人姓名"),
              vue.createElementVNode("view", { class: "t11 c3 mt4" }, "给医生看时不必暴露家庭关系")
            ]),
            vue.createVNode($setup["JdSwitch"], {
              modelValue: $setup.hideNames,
              "onUpdate:modelValue": _cache[8] || (_cache[8] = ($event) => $setup.hideNames = $event),
              class: "ml-auto",
              onChange: $setup.refreshPreview
            }, null, 8, ["modelValue"])
          ])
        ]),
        vue.createElementVNode("view", { class: "disc mt14" }, [
          vue.createElementVNode("text", { class: "b" }, "导出会留下记录。"),
          vue.createTextVNode(" 文件带「仅用于就医沟通」水印，长辈可在「谁看过我的档案」里看到这次导出。 ")
        ]),
        vue.createElementVNode(
          "view",
          { class: "t11 c3 mt12" },
          vue.toDisplayString($setup.quotaText),
          1
          /* TEXT */
        ),
        !$setup.canExport ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "card flat mt12 quota-card"
        }, [
          vue.createElementVNode("view", { class: "f1" }, [
            vue.createElementVNode("view", { class: "t13 sb" }, "导出 PDF 是家庭会员权益"),
            vue.createElementVNode("view", { class: "t11 c3 mt4" }, "99 元 / 年，含 30 次导出与短信兜底提醒")
          ]),
          vue.createElementVNode("button", {
            class: "btn btn-2nd btn-sm",
            onClick: _cache[9] || (_cache[9] = ($event) => $setup.go("/pages/vip/vip"))
          }, "去开通")
        ])) : vue.createCommentVNode("v-if", true)
      ]),
      vue.createElementVNode("view", { class: "actionbar" }, [
        vue.createElementVNode("button", {
          class: "btn btn-primary",
          disabled: $setup.generating || !$setup.canExport,
          onClick: $setup.generate
        }, vue.toDisplayString($setup.generating ? "正在生成 PDF…" : "生成 PDF"), 9, ["disabled"])
      ]),
      vue.createVNode(_component_u_popup, {
        show: $setup.showResult,
        "onUpdate:show": _cache[11] || (_cache[11] = ($event) => $setup.showResult = $event),
        mode: "center",
        round: "18",
        width: "300px"
      }, {
        default: vue.withCtx(() => [
          vue.createElementVNode("view", { class: "result" }, [
            vue.createElementVNode("view", { class: "ok-icon" }, [
              vue.createVNode($setup["JdIcon"], {
                name: "check",
                size: 26,
                color: "#0F7B4F"
              })
            ]),
            vue.createElementVNode("view", { class: "t17 b mt10" }, "PDF 已生成"),
            vue.createElementVNode(
              "view",
              {
                class: "t11 c3 mt6 tc",
                style: { "line-height": "18px" }
              },
              " 共 " + vue.toDisplayString($setup.result.eventCount) + " 条事件 · 带「仅用于就医沟通」水印 ",
              1
              /* TEXT */
            ),
            vue.createElementVNode("button", {
              class: "btn btn-primary mt16",
              onClick: $setup.download
            }, "保存 / 打开 PDF"),
            vue.createElementVNode("button", {
              class: "btn btn-ghost mt8",
              onClick: $setup.copyLink
            }, "复制下载链接"),
            vue.createElementVNode("button", {
              class: "btn btn-sunk mt8",
              onClick: _cache[10] || (_cache[10] = ($event) => $setup.showResult = false)
            }, "先不下载")
          ])
        ]),
        _: 1
        /* STABLE */
      }, 8, ["show"])
    ]);
  }
  const PagesExportExport = /* @__PURE__ */ _export_sfc(_sfc_main$8, [["render", _sfc_render$7], ["__scopeId", "data-v-3d357165"], ["__file", "D:/workZone/APP/frontend/src/pages/export/export.vue"]]);
  const _sfc_main$7 = {
    __name: "profile",
    setup(__props, { expose: __expose }) {
      __expose();
      const session2 = useSession();
      const detail = vue.ref(null);
      const showEdit = vue.ref(false);
      const showFollowUp = vue.ref(false);
      const saving = vue.ref(false);
      const editForm = vue.ref({});
      const accessRecorded = vue.ref(false);
      const elderId = vue.computed(() => detail.value ? detail.value.elder.id : session2.elder ? session2.elder.id : 1);
      const followUp = vue.computed(() => detail.value && detail.value.followUps.length ? detail.value.followUps[0] : null);
      const editFields = [
        { key: "name", label: "姓名", placeholder: "王建国" },
        { key: "birthday", label: "生日", placeholder: "1958-03-12" },
        { key: "conditions", label: "既往史", placeholder: "高血压、轻度脂肪肝" },
        { key: "allergies", label: "过敏史", placeholder: "青霉素" },
        { key: "hospital", label: "常去医院", placeholder: "市一院" },
        { key: "doctor", label: "医生", placeholder: "王志远" },
        { key: "height", label: "身高", placeholder: "172cm" },
        { key: "weight", label: "体重", placeholder: "68kg" },
        { key: "bloodType", label: "血型", placeholder: "AB" }
      ];
      vue.onMounted(load);
      onShow(() => {
        if (session2.token)
          load();
      });
      async function load() {
        try {
          const res = await elderApi.detail(elderId.value || 1);
          detail.value = res;
          if (res && res.elder && !accessRecorded.value) {
            accessRecorded.value = true;
            await elderApi.recordAccess(res.elder.id, { scope: "查看档案", action: "view" });
          }
        } catch (e) {
        }
      }
      function avatarColor(tag) {
        if (tag === "本人")
          return "dad";
        if (tag === "导出")
          return "owner";
        return "sis";
      }
      function openEdit() {
        if (!detail.value)
          return;
        if (!(session2.member && session2.member.role === "owner")) {
          uni.showToast({ title: "仅主理子女可编辑档案", icon: "none" });
          return;
        }
        const e = detail.value.elder;
        editForm.value = {
          name: e.name,
          birthday: e.birthday,
          conditions: e.conditions,
          allergies: e.allergies,
          hospital: e.hospital,
          doctor: e.doctor,
          height: e.height,
          weight: e.weight,
          bloodType: e.bloodType
        };
        showEdit.value = true;
      }
      async function saveEdit() {
        if (saving.value)
          return;
        saving.value = true;
        try {
          await elderApi.update(elderId.value, editForm.value);
          showEdit.value = false;
          uni.showToast({ title: "已保存", icon: "none" });
          load();
        } catch (e) {
        } finally {
          saving.value = false;
        }
      }
      function openFollowUp() {
        if (!followUp.value) {
          uni.showToast({ title: "还没有设置复诊周期", icon: "none" });
          return;
        }
        showFollowUp.value = true;
      }
      async function generateFollowUpTask() {
        if (!followUp.value)
          return;
        if (!(session2.member && session2.member.role === "owner")) {
          uni.showToast({ title: "复诊任务需主理子女生成", icon: "none" });
          return;
        }
        try {
          const res = await medApi.generateFollowUpTask(followUp.value.id);
          showFollowUp.value = false;
          uni.showToast({ title: res.msg || "已生成待确认的复诊任务", icon: "none" });
        } catch (e) {
        }
      }
      function go2(url2) {
        uni.navigateTo({ url: url2 });
      }
      const __returned__ = { session: session2, detail, showEdit, showFollowUp, saving, editForm, accessRecorded, elderId, followUp, editFields, load, avatarColor, openEdit, saveEdit, openFollowUp, generateFollowUpTask, go: go2, ref: vue.ref, computed: vue.computed, onMounted: vue.onMounted, get onShow() {
        return onShow;
      }, JdNav, JdTabbar, JdAvatar, JdIcon, get elderApi() {
        return elderApi;
      }, get medApi() {
        return medApi;
      }, get useSession() {
        return useSession;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$6(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_u_popup = resolveEasycom(vue.resolveDynamicComponent("u-popup"), __easycom_0$1);
    return vue.openBlock(), vue.createElementBlock("view", { class: "jd-page" }, [
      vue.createVNode($setup["JdNav"], {
        title: "档案",
        action: "编辑",
        onAction: $setup.openEdit
      }),
      vue.createElementVNode("scroll-view", {
        class: "jd-body scroll",
        "scroll-y": "",
        "show-scrollbar": false
      }, [
        $setup.detail ? (vue.openBlock(), vue.createElementBlock(
          vue.Fragment,
          { key: 0 },
          [
            vue.createElementVNode("view", { class: "card hero mt6" }, [
              vue.createElementVNode("view", { class: "row g12" }, [
                vue.createVNode($setup["JdAvatar"], {
                  text: $setup.detail.elder.name.slice(0, 1),
                  color: "dad",
                  size: "lg"
                }, null, 8, ["text"]),
                vue.createElementVNode("view", { class: "f1" }, [
                  vue.createElementVNode(
                    "text",
                    { class: "t17 b" },
                    vue.toDisplayString($setup.detail.elder.name),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode(
                    "view",
                    { class: "t12 c2 mt4" },
                    vue.toDisplayString($setup.detail.elder.age ? $setup.detail.elder.age + " 岁" : "") + " · " + vue.toDisplayString($setup.detail.elder.conditions || "档案待补充"),
                    1
                    /* TEXT */
                  )
                ]),
                vue.createElementVNode(
                  "view",
                  { class: "tag" },
                  "完整度 " + vue.toDisplayString($setup.detail.elder.completeness) + "%",
                  1
                  /* TEXT */
                )
              ]),
              vue.createElementVNode("view", { class: "row g8 mt12 wrap" }, [
                vue.createElementVNode(
                  "view",
                  { class: "tag" },
                  vue.toDisplayString($setup.detail.badges.nextCheckupLabel),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode(
                  "view",
                  { class: "tag" },
                  "用药 " + vue.toDisplayString($setup.detail.badges.medCount) + " 种",
                  1
                  /* TEXT */
                ),
                vue.createElementVNode(
                  "view",
                  { class: "tag brand" },
                  "已授权 " + vue.toDisplayString($setup.detail.badges.authorizedCount) + " 人",
                  1
                  /* TEXT */
                )
              ])
            ]),
            vue.createElementVNode("view", { class: "row g8 mt12" }, [
              vue.createElementVNode("view", {
                class: "btn btn-ghost grid-btn",
                onClick: _cache[0] || (_cache[0] = ($event) => $setup.go("/pages/meds/meds"))
              }, [
                vue.createVNode($setup["JdIcon"], {
                  name: "clock",
                  size: 18,
                  color: "#171210"
                }),
                vue.createElementVNode("text", { class: "t11" }, "用药清单")
              ]),
              vue.createElementVNode("view", {
                class: "btn btn-ghost grid-btn",
                onClick: _cache[1] || (_cache[1] = ($event) => $setup.go("/pages/report/report"))
              }, [
                vue.createVNode($setup["JdIcon"], {
                  name: "doc",
                  size: 18,
                  color: "#171210"
                }),
                vue.createElementVNode("text", { class: "t11" }, "化验单")
              ]),
              vue.createElementVNode("view", {
                class: "btn btn-ghost grid-btn",
                onClick: $setup.openFollowUp
              }, [
                vue.createVNode($setup["JdIcon"], {
                  name: "cal",
                  size: 18,
                  color: "#171210"
                }),
                vue.createElementVNode("text", { class: "t11" }, "复诊周期")
              ])
            ]),
            vue.createElementVNode("view", { class: "t12 c2 sb mt18 mb8" }, "基础信息"),
            vue.createElementVNode("view", { class: "list" }, [
              (vue.openBlock(true), vue.createElementBlock(
                vue.Fragment,
                null,
                vue.renderList($setup.detail.fields, (f) => {
                  return vue.openBlock(), vue.createElementBlock("view", {
                    key: f.key,
                    class: "li",
                    onClick: $setup.openEdit
                  }, [
                    vue.createElementVNode(
                      "text",
                      { class: "lb" },
                      vue.toDisplayString(f.label),
                      1
                      /* TEXT */
                    ),
                    vue.createElementVNode(
                      "text",
                      {
                        class: vue.normalizeClass(["vl el", { cbad: f.danger }])
                      },
                      vue.toDisplayString(f.value || "未填写"),
                      3
                      /* TEXT, CLASS */
                    ),
                    vue.createElementVNode("text", { class: "chev" }, "›")
                  ]);
                }),
                128
                /* KEYED_FRAGMENT */
              ))
            ]),
            vue.createElementVNode("view", { class: "t12 c2 sb mt18 mb8" }, "谁看过这份档案"),
            vue.createElementVNode("view", { class: "list" }, [
              (vue.openBlock(true), vue.createElementBlock(
                vue.Fragment,
                null,
                vue.renderList($setup.detail.accessLogs, (log) => {
                  return vue.openBlock(), vue.createElementBlock("view", {
                    key: log.id,
                    class: "li"
                  }, [
                    vue.createVNode($setup["JdAvatar"], {
                      text: log.avatarText,
                      color: $setup.avatarColor(log.viewerTag),
                      size: "sm"
                    }, null, 8, ["text", "color"]),
                    vue.createElementVNode("view", { class: "f1" }, [
                      vue.createElementVNode(
                        "text",
                        { class: "lb" },
                        vue.toDisplayString(log.viewerName),
                        1
                        /* TEXT */
                      ),
                      vue.createElementVNode(
                        "view",
                        { class: "t11 c3 mt4" },
                        vue.toDisplayString(log.timeLabel) + " · " + vue.toDisplayString(log.action === "export" ? "导出 " : "") + vue.toDisplayString(log.scope),
                        1
                        /* TEXT */
                      )
                    ]),
                    vue.createElementVNode(
                      "view",
                      { class: "tag" },
                      vue.toDisplayString(log.viewerTag),
                      1
                      /* TEXT */
                    )
                  ]);
                }),
                128
                /* KEYED_FRAGMENT */
              )),
              !$setup.detail.accessLogs.length ? (vue.openBlock(), vue.createElementBlock("view", {
                key: 0,
                class: "li"
              }, [
                vue.createElementVNode("text", { class: "t12 c3" }, "还没有人查看过这份档案。")
              ])) : vue.createCommentVNode("v-if", true)
            ]),
            vue.createElementVNode("view", { class: "card flat mt12 notice" }, [
              vue.createElementVNode(
                "text",
                {
                  class: "t11 c2",
                  style: { "line-height": "18px" }
                },
                vue.toDisplayString($setup.detail.notice),
                1
                /* TEXT */
              )
            ])
          ],
          64
          /* STABLE_FRAGMENT */
        )) : vue.createCommentVNode("v-if", true)
      ]),
      vue.createVNode($setup["JdTabbar"], { active: "profile" }),
      vue.createVNode(_component_u_popup, {
        show: $setup.showEdit,
        "onUpdate:show": _cache[2] || (_cache[2] = ($event) => $setup.showEdit = $event),
        mode: "bottom",
        round: "20",
        safeAreaInsetBottom: true
      }, {
        default: vue.withCtx(() => [
          vue.createElementVNode("scroll-view", {
            "scroll-y": "",
            class: "edit-pop"
          }, [
            vue.createElementVNode("view", { class: "pop" }, [
              vue.createElementVNode("view", { class: "pop-title" }, "编辑档案"),
              vue.createElementVNode("view", { class: "t11 c3 mb10" }, "档案默认仅你与长辈本人可见。"),
              (vue.openBlock(), vue.createElementBlock(
                vue.Fragment,
                null,
                vue.renderList($setup.editFields, (item) => {
                  return vue.createElementVNode("view", {
                    key: item.key,
                    class: "field mt8"
                  }, [
                    vue.createElementVNode(
                      "view",
                      { class: "lab" },
                      vue.toDisplayString(item.label),
                      1
                      /* TEXT */
                    ),
                    vue.withDirectives(vue.createElementVNode("input", {
                      "onUpdate:modelValue": ($event) => $setup.editForm[item.key] = $event,
                      class: "input",
                      placeholder: item.placeholder,
                      "placeholder-class": "ph"
                    }, null, 8, ["onUpdate:modelValue", "placeholder"]), [
                      [vue.vModelText, $setup.editForm[item.key]]
                    ])
                  ]);
                }),
                64
                /* STABLE_FRAGMENT */
              )),
              vue.createElementVNode("button", {
                class: "btn btn-primary mt14",
                disabled: $setup.saving,
                onClick: $setup.saveEdit
              }, "保存", 8, ["disabled"])
            ])
          ])
        ]),
        _: 1
        /* STABLE */
      }, 8, ["show"]),
      vue.createVNode(_component_u_popup, {
        show: $setup.showFollowUp,
        "onUpdate:show": _cache[3] || (_cache[3] = ($event) => $setup.showFollowUp = $event),
        mode: "bottom",
        round: "20",
        safeAreaInsetBottom: true
      }, {
        default: vue.withCtx(() => [
          vue.createElementVNode("view", { class: "pop" }, [
            vue.createElementVNode("view", { class: "pop-title" }, "复诊周期"),
            $setup.followUp ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 0,
              class: "list mt10"
            }, [
              vue.createElementVNode("view", { class: "li" }, [
                vue.createElementVNode("text", { class: "lb" }, "复查项目"),
                vue.createElementVNode(
                  "text",
                  { class: "vl" },
                  vue.toDisplayString($setup.followUp.title),
                  1
                  /* TEXT */
                )
              ]),
              vue.createElementVNode("view", { class: "li" }, [
                vue.createElementVNode("text", { class: "lb" }, "周期"),
                vue.createElementVNode(
                  "text",
                  { class: "vl" },
                  vue.toDisplayString($setup.followUp.cycleLabel),
                  1
                  /* TEXT */
                )
              ]),
              vue.createElementVNode("view", { class: "li" }, [
                vue.createElementVNode("text", { class: "lb" }, "上次"),
                vue.createElementVNode(
                  "text",
                  { class: "vl num" },
                  vue.toDisplayString($setup.followUp.lastDate),
                  1
                  /* TEXT */
                )
              ]),
              vue.createElementVNode("view", { class: "li" }, [
                vue.createElementVNode("text", { class: "lb" }, "下次"),
                vue.createElementVNode(
                  "text",
                  { class: "vl num" },
                  vue.toDisplayString($setup.followUp.nextDate),
                  1
                  /* TEXT */
                )
              ])
            ])) : vue.createCommentVNode("v-if", true),
            vue.createElementVNode("view", { class: "disc mt12" }, "复诊任务生成后会先「待你确认」，避免误排让长辈白跑一趟。"),
            vue.createElementVNode("button", {
              class: "btn btn-primary mt14",
              onClick: $setup.generateFollowUpTask
            }, "生成复诊任务")
          ])
        ]),
        _: 1
        /* STABLE */
      }, 8, ["show"])
    ]);
  }
  const PagesProfileProfile = /* @__PURE__ */ _export_sfc(_sfc_main$7, [["render", _sfc_render$6], ["__scopeId", "data-v-04d37cba"], ["__file", "D:/workZone/APP/frontend/src/pages/profile/profile.vue"]]);
  const _sfc_main$6 = {
    __name: "meds",
    setup(__props, { expose: __expose }) {
      __expose();
      const session2 = useSession();
      const data = vue.ref(null);
      const elderIdParam = vue.ref(0);
      const showAdd = vue.ref(false);
      const showFollowUp = vue.ref(false);
      const takingId = vue.ref(0);
      const refillingId = vue.ref(0);
      const form = vue.ref({ name: "", dosage: "", frequency: "每日 1 次", timing: "早饭后", remainingDays: "30" });
      const fuForm = vue.ref({ id: 0, title: "", cycleDays: 90, lastDate: "", nextDate: "" });
      const elderId = vue.computed(() => elderIdParam.value || (session2.elder ? session2.elder.id : 1));
      const isOwner2 = vue.computed(() => Boolean(session2.member && session2.member.role === "owner"));
      onLoad((query) => {
        elderIdParam.value = Number(query.elderId || 0);
      });
      vue.onMounted(load);
      onShow(() => {
        if (session2.token)
          load();
      });
      async function load() {
        try {
          data.value = await medApi.list(elderId.value);
        } catch (e) {
        }
      }
      function openAdd() {
        form.value = { name: "", dosage: "", frequency: "每日 1 次", timing: "早饭后", remainingDays: "30" };
        showAdd.value = true;
      }
      async function saveMed() {
        if (!form.value.name.trim()) {
          uni.showToast({ title: "请填写药品名", icon: "none" });
          return;
        }
        try {
          const remaining = Math.max(1, Number(form.value.remainingDays || 30));
          await medApi.create(elderId.value, {
            name: form.value.name.trim(),
            dosage: form.value.dosage,
            frequency: form.value.frequency,
            timing: form.value.timing,
            totalDays: Math.max(30, remaining),
            remainingDays: remaining,
            remainingQty: remaining
          });
          showAdd.value = false;
          uni.showToast({ title: "已添加", icon: "none" });
          load();
        } catch (e) {
        }
      }
      async function take(med) {
        if (takingId.value)
          return;
        takingId.value = med.id;
        try {
          const res = await medApi.take(med.id);
          uni.showToast({ title: res.msg || "已打卡", icon: "none" });
          await load();
        } catch (e) {
        } finally {
          takingId.value = 0;
        }
      }
      async function refill(med) {
        if (refillingId.value)
          return;
        refillingId.value = med.id;
        try {
          const res = await medApi.refill(med.id);
          uni.showToast({ title: res.msg || "已生成「该买药了」任务", icon: "none" });
        } catch (e) {
        } finally {
          refillingId.value = 0;
        }
      }
      function openFollowUp() {
        if (!isOwner2.value) {
          uni.showToast({ title: "复诊周期需主理子女调整", icon: "none" });
          return;
        }
        const fu = data.value && data.value.followUps[0];
        if (fu) {
          fuForm.value = { id: fu.id, title: fu.title, cycleDays: fu.cycleDays, lastDate: fu.lastDate, nextDate: fu.nextDate };
        } else {
          fuForm.value = { id: 0, title: "心内科复查", cycleDays: 90, lastDate: "", nextDate: "" };
        }
        showFollowUp.value = true;
      }
      async function saveFollowUp() {
        if (!isOwner2.value) {
          uni.showToast({ title: "复诊周期需主理子女确认", icon: "none" });
          return;
        }
        try {
          const payload = {
            title: fuForm.value.title,
            cycleDays: Number(fuForm.value.cycleDays),
            lastDate: fuForm.value.lastDate,
            nextDate: fuForm.value.nextDate
          };
          const res = fuForm.value.id ? await medApi.updateFollowUp(fuForm.value.id, payload) : await medApi.createFollowUp(elderId.value, payload);
          showFollowUp.value = false;
          uni.showToast({ title: res.msg || "已保存", icon: "none" });
          load();
        } catch (e) {
        }
      }
      async function generateFollowUpTask(fu) {
        if (!isOwner2.value) {
          uni.showToast({ title: "复诊任务需主理子女生成", icon: "none" });
          return;
        }
        try {
          const res = await medApi.generateFollowUpTask(fu.id);
          uni.showToast({ title: res.msg || "已生成待确认的复诊任务", icon: "none" });
        } catch (e) {
        }
      }
      const __returned__ = { session: session2, data, elderIdParam, showAdd, showFollowUp, takingId, refillingId, form, fuForm, elderId, isOwner: isOwner2, load, openAdd, saveMed, take, refill, openFollowUp, saveFollowUp, generateFollowUpTask, ref: vue.ref, computed: vue.computed, onMounted: vue.onMounted, get onLoad() {
        return onLoad;
      }, get onShow() {
        return onShow;
      }, JdNav, get medApi() {
        return medApi;
      }, get useSession() {
        return useSession;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$5(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_u_popup = resolveEasycom(vue.resolveDynamicComponent("u-popup"), __easycom_0$1);
    return vue.openBlock(), vue.createElementBlock("view", { class: "jd-page" }, [
      vue.createVNode($setup["JdNav"], {
        title: "用药清单",
        back: "",
        action: "＋",
        onAction: $setup.openAdd
      }),
      vue.createElementVNode("scroll-view", {
        class: "jd-body scroll",
        "scroll-y": "",
        "show-scrollbar": false
      }, [
        vue.createElementVNode("view", { class: "card flat tight notice-card mt6" }, [
          vue.createElementVNode(
            "text",
            {
              class: "t11",
              style: { "color": "#6b5b3e", "line-height": "18px" }
            },
            vue.toDisplayString($setup.data ? $setup.data.notice : ""),
            1
            /* TEXT */
          )
        ]),
        $setup.data ? (vue.openBlock(), vue.createElementBlock("view", { key: 0 }, [
          (vue.openBlock(true), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($setup.data.medications, (med) => {
              return vue.openBlock(), vue.createElementBlock(
                "view",
                {
                  key: med.id,
                  class: vue.normalizeClass(["card mt12", { stopped: med.status === "stopped" }])
                },
                [
                  vue.createElementVNode("view", { class: "between" }, [
                    vue.createElementVNode(
                      "text",
                      { class: "t15 sb" },
                      vue.toDisplayString(med.name),
                      1
                      /* TEXT */
                    ),
                    vue.createElementVNode(
                      "view",
                      {
                        class: vue.normalizeClass(["tag", med.needBuy ? "brand" : ""])
                      },
                      vue.toDisplayString(med.status === "stopped" ? "已停用" : "剩 " + med.remainingDays + " 天"),
                      3
                      /* TEXT, CLASS */
                    )
                  ]),
                  vue.createElementVNode(
                    "view",
                    { class: "t12 c3 mt6" },
                    vue.toDisplayString(med.dosage) + " · " + vue.toDisplayString(med.frequency) + " · " + vue.toDisplayString(med.timing),
                    1
                    /* TEXT */
                  ),
                  med.status === "active" ? (vue.openBlock(), vue.createElementBlock(
                    vue.Fragment,
                    { key: 0 },
                    [
                      vue.createElementVNode(
                        "view",
                        {
                          class: vue.normalizeClass(["bar mt10", { ok: !med.needBuy }])
                        },
                        [
                          vue.createElementVNode(
                            "i",
                            {
                              style: vue.normalizeStyle({ width: Math.max(2, med.percent) + "%" })
                            },
                            null,
                            4
                            /* STYLE */
                          )
                        ],
                        2
                        /* CLASS */
                      ),
                      vue.createElementVNode("view", { class: "between mt8" }, [
                        vue.createElementVNode(
                          "text",
                          { class: "t11 c3" },
                          vue.toDisplayString(med.startDate) + " 开始 · 剩 " + vue.toDisplayString(med.remainingQty) + " 片",
                          1
                          /* TEXT */
                        ),
                        vue.createElementVNode("view", { class: "row g10" }, [
                          med.needBuy ? (vue.openBlock(), vue.createElementBlock("text", {
                            key: 0,
                            class: "t11 cbrand sb",
                            onClick: ($event) => $setup.refill(med)
                          }, "该买药了 ›", 8, ["onClick"])) : (vue.openBlock(), vue.createElementBlock("text", {
                            key: 1,
                            class: "t11 c3"
                          }, "无需处理")),
                          vue.createElementVNode("text", {
                            class: "t11 cbrand",
                            onClick: ($event) => $setup.take(med)
                          }, "打卡", 8, ["onClick"])
                        ])
                      ])
                    ],
                    64
                    /* STABLE_FRAGMENT */
                  )) : (vue.openBlock(), vue.createElementBlock(
                    "view",
                    {
                      key: 1,
                      class: "t11 c3 mt8"
                    },
                    vue.toDisplayString(med.startDate) + " 开始 · " + vue.toDisplayString(med.endDate) + " 停用 · 记录保留 ",
                    1
                    /* TEXT */
                  ))
                ],
                2
                /* CLASS */
              );
            }),
            128
            /* KEYED_FRAGMENT */
          )),
          vue.createElementVNode("view", { class: "sec" }, [
            vue.createElementVNode("view", { class: "h" }, "复诊周期"),
            vue.createElementVNode("text", {
              class: "more",
              onClick: $setup.openFollowUp
            }, "调整")
          ]),
          (vue.openBlock(true), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($setup.data.followUps, (fu) => {
              return vue.openBlock(), vue.createElementBlock("view", {
                key: fu.id,
                class: "card tight"
              }, [
                vue.createElementVNode("view", { class: "between" }, [
                  vue.createElementVNode(
                    "text",
                    { class: "t13 sb" },
                    vue.toDisplayString(fu.title),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode(
                    "text",
                    { class: "t12 c3" },
                    vue.toDisplayString(fu.cycleLabel),
                    1
                    /* TEXT */
                  )
                ]),
                vue.createElementVNode(
                  "view",
                  { class: "t11 c3 mt6" },
                  " 上次 " + vue.toDisplayString(fu.lastDate) + " · 下次 " + vue.toDisplayString(fu.nextDate) + " · " + vue.toDisplayString(fu.note),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode("button", {
                  class: "btn btn-2nd btn-sm mt10",
                  style: { "width": "auto" },
                  onClick: ($event) => $setup.generateFollowUpTask(fu)
                }, " 生成复诊任务 ", 8, ["onClick"])
              ]);
            }),
            128
            /* KEYED_FRAGMENT */
          )),
          vue.createElementVNode("view", { class: "disc mt14" }, [
            vue.createElementVNode("text", { class: "b" }, "关于自动生成："),
            vue.createTextVNode(
              " " + vue.toDisplayString($setup.data.followUpNotice),
              1
              /* TEXT */
            )
          ])
        ])) : vue.createCommentVNode("v-if", true)
      ]),
      vue.createVNode(_component_u_popup, {
        show: $setup.showAdd,
        "onUpdate:show": _cache[5] || (_cache[5] = ($event) => $setup.showAdd = $event),
        mode: "bottom",
        round: "20",
        safeAreaInsetBottom: true
      }, {
        default: vue.withCtx(() => [
          vue.createElementVNode("scroll-view", {
            "scroll-y": "",
            class: "pop-scroll"
          }, [
            vue.createElementVNode("view", { class: "pop" }, [
              vue.createElementVNode("view", { class: "pop-title" }, "添加用药"),
              vue.createElementVNode("view", { class: "t11 c3 mb10" }, "只记录「吃什么、怎么吃、还剩多少」。"),
              vue.createElementVNode("view", { class: "field mt8" }, [
                vue.createElementVNode("view", { class: "lab" }, "药品名"),
                vue.withDirectives(vue.createElementVNode(
                  "input",
                  {
                    "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => $setup.form.name = $event),
                    class: "input",
                    placeholder: "例如：苯磺酸氨氯地平",
                    "placeholder-class": "ph"
                  },
                  null,
                  512
                  /* NEED_PATCH */
                ), [
                  [vue.vModelText, $setup.form.name]
                ])
              ]),
              vue.createElementVNode("view", { class: "row g8 mt8" }, [
                vue.createElementVNode("view", { class: "field f1" }, [
                  vue.createElementVNode("view", { class: "lab" }, "剂量"),
                  vue.withDirectives(vue.createElementVNode(
                    "input",
                    {
                      "onUpdate:modelValue": _cache[1] || (_cache[1] = ($event) => $setup.form.dosage = $event),
                      class: "input",
                      placeholder: "5mg",
                      "placeholder-class": "ph"
                    },
                    null,
                    512
                    /* NEED_PATCH */
                  ), [
                    [vue.vModelText, $setup.form.dosage]
                  ])
                ]),
                vue.createElementVNode("view", { class: "field f1" }, [
                  vue.createElementVNode("view", { class: "lab" }, "频次"),
                  vue.withDirectives(vue.createElementVNode(
                    "input",
                    {
                      "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => $setup.form.frequency = $event),
                      class: "input",
                      placeholder: "每日 1 次",
                      "placeholder-class": "ph"
                    },
                    null,
                    512
                    /* NEED_PATCH */
                  ), [
                    [vue.vModelText, $setup.form.frequency]
                  ])
                ])
              ]),
              vue.createElementVNode("view", { class: "row g8 mt8" }, [
                vue.createElementVNode("view", { class: "field f1" }, [
                  vue.createElementVNode("view", { class: "lab" }, "服用时间"),
                  vue.withDirectives(vue.createElementVNode(
                    "input",
                    {
                      "onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => $setup.form.timing = $event),
                      class: "input",
                      placeholder: "早饭后",
                      "placeholder-class": "ph"
                    },
                    null,
                    512
                    /* NEED_PATCH */
                  ), [
                    [vue.vModelText, $setup.form.timing]
                  ])
                ]),
                vue.createElementVNode("view", { class: "field f1" }, [
                  vue.createElementVNode("view", { class: "lab" }, "剩余天数"),
                  vue.withDirectives(vue.createElementVNode(
                    "input",
                    {
                      "onUpdate:modelValue": _cache[4] || (_cache[4] = ($event) => $setup.form.remainingDays = $event),
                      class: "input num",
                      type: "number",
                      placeholder: "30",
                      "placeholder-class": "ph"
                    },
                    null,
                    512
                    /* NEED_PATCH */
                  ), [
                    [vue.vModelText, $setup.form.remainingDays]
                  ])
                ])
              ]),
              vue.createElementVNode("button", {
                class: "btn btn-primary mt14",
                onClick: $setup.saveMed
              }, "保存")
            ])
          ])
        ]),
        _: 1
        /* STABLE */
      }, 8, ["show"]),
      vue.createVNode(_component_u_popup, {
        show: $setup.showFollowUp,
        "onUpdate:show": _cache[10] || (_cache[10] = ($event) => $setup.showFollowUp = $event),
        mode: "bottom",
        round: "20",
        safeAreaInsetBottom: true
      }, {
        default: vue.withCtx(() => [
          vue.createElementVNode("view", { class: "pop" }, [
            vue.createElementVNode("view", { class: "pop-title" }, "调整复诊周期"),
            vue.createElementVNode("view", { class: "field mt10" }, [
              vue.createElementVNode("view", { class: "lab" }, "复查项目"),
              vue.withDirectives(vue.createElementVNode(
                "input",
                {
                  "onUpdate:modelValue": _cache[6] || (_cache[6] = ($event) => $setup.fuForm.title = $event),
                  class: "input",
                  placeholder: "心内科复查",
                  "placeholder-class": "ph"
                },
                null,
                512
                /* NEED_PATCH */
              ), [
                [vue.vModelText, $setup.fuForm.title]
              ])
            ]),
            vue.createElementVNode("view", { class: "field mt8" }, [
              vue.createElementVNode("view", { class: "lab" }, "周期（天）"),
              vue.withDirectives(vue.createElementVNode(
                "input",
                {
                  "onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => $setup.fuForm.cycleDays = $event),
                  class: "input num",
                  type: "number",
                  placeholder: "90",
                  "placeholder-class": "ph"
                },
                null,
                512
                /* NEED_PATCH */
              ), [
                [vue.vModelText, $setup.fuForm.cycleDays]
              ])
            ]),
            vue.createElementVNode("view", { class: "row g8 mt8" }, [
              vue.createElementVNode("picker", {
                mode: "date",
                value: $setup.fuForm.lastDate,
                class: "f1",
                onChange: _cache[8] || (_cache[8] = (e) => $setup.fuForm.lastDate = e.detail.value)
              }, [
                vue.createElementVNode("view", { class: "field" }, [
                  vue.createElementVNode("view", { class: "lab" }, "上次复查"),
                  vue.createElementVNode(
                    "view",
                    { class: "val num" },
                    vue.toDisplayString($setup.fuForm.lastDate),
                    1
                    /* TEXT */
                  )
                ])
              ], 40, ["value"]),
              vue.createElementVNode("picker", {
                mode: "date",
                value: $setup.fuForm.nextDate,
                class: "f1",
                onChange: _cache[9] || (_cache[9] = (e) => $setup.fuForm.nextDate = e.detail.value)
              }, [
                vue.createElementVNode("view", { class: "field" }, [
                  vue.createElementVNode("view", { class: "lab" }, "下次复查"),
                  vue.createElementVNode(
                    "view",
                    { class: "val num" },
                    vue.toDisplayString($setup.fuForm.nextDate),
                    1
                    /* TEXT */
                  )
                ])
              ], 40, ["value"])
            ]),
            vue.createElementVNode("button", {
              class: "btn btn-primary mt14",
              onClick: $setup.saveFollowUp
            }, "保存")
          ])
        ]),
        _: 1
        /* STABLE */
      }, 8, ["show"])
    ]);
  }
  const PagesMedsMeds = /* @__PURE__ */ _export_sfc(_sfc_main$6, [["render", _sfc_render$5], ["__scopeId", "data-v-3a9d5555"], ["__file", "D:/workZone/APP/frontend/src/pages/meds/meds.vue"]]);
  const _sfc_main$5 = {
    __name: "report",
    setup(__props, { expose: __expose }) {
      __expose();
      const reports = vue.ref([]);
      const current = vue.ref(null);
      const quota = vue.ref(null);
      const disclaimer = vue.ref("");
      const notice = vue.ref("");
      const showAnalyze = vue.ref(false);
      const showHistory = vue.ref(false);
      const analyzing = vue.ref(false);
      const uploading = vue.ref(false);
      const imageUrl = vue.ref("");
      const title = vue.ref("血常规 + 生化 12 项");
      const titles = ["血常规 + 生化 12 项", "尿常规", "肝功能", "肾功能", "血脂四项"];
      const quotaText = vue.computed(() => {
        if (!quota.value)
          return "—";
        if (quota.value.limit < 0)
          return "不限次";
        return `${quota.value.used} / ${quota.value.limit} 次`;
      });
      vue.onMounted(load);
      async function load() {
        try {
          const res = await reportApi.list();
          reports.value = res.reports;
          quota.value = res.quota;
          disclaimer.value = res.disclaimer;
          notice.value = res.notice;
          current.value = res.latest || null;
        } catch (e) {
        }
      }
      function selectReport(item, closeSheet = false) {
        current.value = item;
        if (closeSheet)
          showHistory.value = false;
      }
      function chooseImage() {
        uni.chooseImage({
          count: 1,
          success: async (res) => {
            const path = res.tempFilePaths[0];
            uploading.value = true;
            try {
              const data = await upload({ url: "/api/upload", filePath: path });
              if (!data || !data.url)
                return;
              imageUrl.value = data.url;
              title.value = "血常规 + 生化 12 项";
              showAnalyze.value = true;
            } catch (e) {
            } finally {
              uploading.value = false;
            }
          }
        });
      }
      async function analyze() {
        if (analyzing.value)
          return;
        if (!imageUrl.value) {
          uni.showToast({ title: "请先上传化验单照片", icon: "none" });
          return;
        }
        analyzing.value = true;
        try {
          const res = await reportApi.analyze({ title: title.value, imageUrl: imageUrl.value });
          showAnalyze.value = false;
          current.value = res.report;
          quota.value = res.quota;
          uni.showToast({ title: "解读完成，已归档", icon: "none" });
          load();
        } catch (e) {
        } finally {
          analyzing.value = false;
        }
      }
      async function addToAskList() {
        if (!current.value)
          return;
        try {
          const res = await reportApi.askList(current.value.id);
          uni.showToast({ title: res.msg || "已加入问诊清单", icon: "none" });
          load();
        } catch (e) {
        }
      }
      function flagText(flag2) {
        if (flag2 === "high")
          return "↑";
        if (flag2 === "low")
          return "↓";
        return "";
      }
      function go2(url2) {
        uni.navigateTo({ url: url2 });
      }
      const __returned__ = { reports, current, quota, disclaimer, notice, showAnalyze, showHistory, analyzing, uploading, imageUrl, title, titles, quotaText, load, selectReport, chooseImage, analyze, addToAskList, flagText, go: go2, ref: vue.ref, computed: vue.computed, onMounted: vue.onMounted, JdNav, JdIcon, JdAvatar, get reportApi() {
        return reportApi;
      }, get assetUrl() {
        return assetUrl;
      }, get upload() {
        return upload;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$4(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_u_popup = resolveEasycom(vue.resolveDynamicComponent("u-popup"), __easycom_0$1);
    return vue.openBlock(), vue.createElementBlock("view", { class: "jd-page" }, [
      vue.createVNode($setup["JdNav"], {
        title: "报告解读",
        back: "",
        action: "历史",
        onAction: _cache[0] || (_cache[0] = ($event) => $setup.showHistory = true)
      }),
      vue.createElementVNode("scroll-view", {
        class: "jd-body scroll",
        "scroll-y": "",
        "show-scrollbar": false
      }, [
        vue.createElementVNode("view", { class: "card capture mt6" }, [
          vue.createElementVNode("view", {
            class: "photo-area",
            onClick: $setup.chooseImage
          }, [
            vue.createElementVNode("view", { class: "capture-inner" }, [
              vue.createElementVNode("text", { class: "capture-icon" }, "📄"),
              vue.createElementVNode(
                "text",
                { class: "t11 c3 mt4" },
                vue.toDisplayString($setup.uploading ? "正在识别…" : "拍摄化验单"),
                1
                /* TEXT */
              )
            ])
          ]),
          vue.createElementVNode("view", { class: "row g8 capture-actions" }, [
            vue.createElementVNode("button", {
              class: "btn btn-primary",
              style: { "height": "42px", "flex": "1" },
              onClick: $setup.chooseImage
            }, [
              vue.createVNode($setup["JdIcon"], {
                name: "camera",
                size: 16,
                color: "#FFFFFF"
              }),
              vue.createElementVNode("text", null, "拍照")
            ]),
            vue.createElementVNode("button", {
              class: "btn btn-ghost",
              style: { "height": "42px", "flex": "1" },
              onClick: $setup.chooseImage
            }, "相册")
          ])
        ]),
        vue.createElementVNode("view", { class: "between mt12" }, [
          vue.createElementVNode("text", { class: "t11 c3" }, "本月 AI 解读额度"),
          vue.createElementVNode(
            "text",
            { class: "t11 c2" },
            vue.toDisplayString($setup.quotaText),
            1
            /* TEXT */
          )
        ]),
        vue.createElementVNode("view", { class: "t12 c2 sb mt16 mb8" }, "最近解读"),
        vue.createElementVNode("view", { class: "list" }, [
          (vue.openBlock(true), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($setup.reports, (item) => {
              return vue.openBlock(), vue.createElementBlock("view", {
                key: item.id,
                class: "li",
                onClick: ($event) => $setup.selectReport(item)
              }, [
                item.imageUrl ? (vue.openBlock(), vue.createElementBlock("image", {
                  key: 0,
                  class: "photo mini",
                  src: $setup.assetUrl(item.imageUrl),
                  mode: "aspectFill"
                }, null, 8, ["src"])) : (vue.openBlock(), vue.createElementBlock("view", {
                  key: 1,
                  class: "photo mini"
                })),
                vue.createElementVNode("view", { class: "f1" }, [
                  vue.createElementVNode(
                    "text",
                    { class: "lb" },
                    vue.toDisplayString(item.title),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode(
                    "view",
                    { class: "t11 c3 mt4" },
                    vue.toDisplayString(item.dateLabel) + " · " + vue.toDisplayString(item.abnormalCount ? item.abnormalCount + " 项异常" : "全部正常") + " · " + vue.toDisplayString(item.statusLabel),
                    1
                    /* TEXT */
                  )
                ]),
                item.status === "pending_ask" ? (vue.openBlock(), vue.createElementBlock("view", {
                  key: 2,
                  class: "st wait"
                }, [
                  vue.createElementVNode("view", { class: "dot" }),
                  vue.createElementVNode("text", null, "待问诊")
                ])) : (vue.openBlock(), vue.createElementBlock("text", {
                  key: 3,
                  class: "chev"
                }, "›"))
              ], 8, ["onClick"]);
            }),
            128
            /* KEYED_FRAGMENT */
          )),
          !$setup.reports.length ? (vue.openBlock(), vue.createElementBlock("view", {
            key: 0,
            class: "li"
          }, [
            vue.createElementVNode("text", { class: "t12 c3" }, "还没有解读记录，拍一张化验单试试。")
          ])) : vue.createCommentVNode("v-if", true)
        ]),
        $setup.current ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "card mt16"
        }, [
          vue.createElementVNode("view", { class: "row between" }, [
            vue.createElementVNode(
              "text",
              {
                class: "t13 sb",
                style: vue.normalizeStyle({ color: $setup.current.abnormalCount ? "#8A6A28" : "#0F7B4F" })
              },
              vue.toDisplayString($setup.current.abnormalCount ? $setup.current.abnormalCount + " 项不在参考范围" : "全部指标在参考范围"),
              5
              /* TEXT, STYLE */
            ),
            vue.createElementVNode(
              "text",
              { class: "t11 c3" },
              "置信度 " + vue.toDisplayString($setup.current.confidence) + "%",
              1
              /* TEXT */
            )
          ]),
          vue.createElementVNode("view", { class: "row g6 mt10 wrap" }, [
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList($setup.current.indicators, (ind) => {
                return vue.openBlock(), vue.createElementBlock(
                  "view",
                  {
                    key: ind.name,
                    class: vue.normalizeClass(["chip indicator", ind.flag])
                  },
                  vue.toDisplayString(ind.name) + " " + vue.toDisplayString(ind.value) + vue.toDisplayString(ind.unit) + " " + vue.toDisplayString($setup.flagText(ind.flag)),
                  3
                  /* TEXT, CLASS */
                );
              }),
              128
              /* KEYED_FRAGMENT */
            ))
          ]),
          vue.createElementVNode("view", { class: "hr" }),
          vue.createElementVNode("view", { class: "t11 c3" }, "这些指标通常和什么有关"),
          vue.createElementVNode(
            "view",
            {
              class: "t13 c2 mt6",
              style: { "line-height": "20px" }
            },
            vue.toDisplayString($setup.current.summaryMeaning),
            1
            /* TEXT */
          ),
          vue.createElementVNode("view", { class: "hr" }),
          vue.createElementVNode("view", { class: "t11 c3" }, "下次看病可以问医生"),
          vue.createElementVNode("view", { class: "col g6 mt6" }, [
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList($setup.current.questions, (q, i) => {
                return vue.openBlock(), vue.createElementBlock(
                  "text",
                  {
                    key: i,
                    class: "t13 c2"
                  },
                  "· " + vue.toDisplayString(q),
                  1
                  /* TEXT */
                );
              }),
              128
              /* KEYED_FRAGMENT */
            ))
          ])
        ])) : vue.createCommentVNode("v-if", true),
        vue.createElementVNode("view", { class: "disc mt12" }, [
          vue.createElementVNode("text", { class: "b" }, "免责声明"),
          vue.createElementVNode(
            "view",
            {
              class: "mt4",
              style: { "line-height": "18px" }
            },
            vue.toDisplayString($setup.disclaimer),
            1
            /* TEXT */
          )
        ]),
        vue.createElementVNode(
          "view",
          {
            class: "t11 c3 mt12",
            style: { "line-height": "18px" }
          },
          vue.toDisplayString($setup.notice),
          1
          /* TEXT */
        )
      ]),
      vue.createElementVNode("view", { class: "actionbar" }, [
        vue.createElementVNode("button", {
          class: "btn btn-ghost",
          style: { "flex": "1" },
          disabled: !$setup.current,
          onClick: $setup.addToAskList
        }, "加入问诊清单", 8, ["disabled"]),
        vue.createElementVNode("button", {
          class: "btn btn-primary",
          style: { "flex": "1.2" },
          disabled: !$setup.current,
          onClick: _cache[1] || (_cache[1] = ($event) => $setup.go("/pages/export/export"))
        }, "导出给医生", 8, ["disabled"])
      ]),
      vue.createVNode(_component_u_popup, {
        show: $setup.showAnalyze,
        "onUpdate:show": _cache[3] || (_cache[3] = ($event) => $setup.showAnalyze = $event),
        mode: "bottom",
        round: "20",
        safeAreaInsetBottom: true
      }, {
        default: vue.withCtx(() => [
          vue.createElementVNode("view", { class: "pop" }, [
            vue.createElementVNode("view", { class: "pop-title" }, "这是哪份报告"),
            vue.createElementVNode("view", { class: "t11 c3 mb10" }, "选一个最接近的名称，识别会更准。"),
            vue.createElementVNode("view", { class: "row g6 wrap" }, [
              (vue.openBlock(), vue.createElementBlock(
                vue.Fragment,
                null,
                vue.renderList($setup.titles, (t) => {
                  return vue.createElementVNode("view", {
                    key: t,
                    class: vue.normalizeClass(["chip", { on: $setup.title === t }]),
                    onClick: ($event) => $setup.title = t
                  }, vue.toDisplayString(t), 11, ["onClick"]);
                }),
                64
                /* STABLE_FRAGMENT */
              ))
            ]),
            vue.createElementVNode("view", { class: "field mt12" }, [
              vue.createElementVNode("view", { class: "lab" }, "报告名称"),
              vue.withDirectives(vue.createElementVNode(
                "input",
                {
                  "onUpdate:modelValue": _cache[2] || (_cache[2] = ($event) => $setup.title = $event),
                  class: "input",
                  placeholder: "血常规 + 生化 12 项",
                  "placeholder-class": "ph"
                },
                null,
                512
                /* NEED_PATCH */
              ), [
                [vue.vModelText, $setup.title]
              ])
            ]),
            vue.createElementVNode("button", {
              class: "btn btn-primary mt14",
              disabled: $setup.analyzing,
              onClick: $setup.analyze
            }, vue.toDisplayString($setup.analyzing ? "正在识别…" : "开始解读"), 9, ["disabled"])
          ])
        ]),
        _: 1
        /* STABLE */
      }, 8, ["show"]),
      vue.createVNode(_component_u_popup, {
        show: $setup.showHistory,
        "onUpdate:show": _cache[4] || (_cache[4] = ($event) => $setup.showHistory = $event),
        mode: "bottom",
        round: "20",
        safeAreaInsetBottom: true
      }, {
        default: vue.withCtx(() => [
          vue.createElementVNode("view", { class: "pop" }, [
            vue.createElementVNode("view", { class: "pop-title" }, "历史解读"),
            vue.createElementVNode("view", { class: "list mt10" }, [
              (vue.openBlock(true), vue.createElementBlock(
                vue.Fragment,
                null,
                vue.renderList($setup.reports, (item) => {
                  return vue.openBlock(), vue.createElementBlock("view", {
                    key: item.id,
                    class: "li",
                    onClick: ($event) => $setup.selectReport(item, true)
                  }, [
                    vue.createElementVNode("view", { class: "f1" }, [
                      vue.createElementVNode(
                        "text",
                        { class: "lb" },
                        vue.toDisplayString(item.title),
                        1
                        /* TEXT */
                      ),
                      vue.createElementVNode(
                        "view",
                        { class: "t11 c3 mt4" },
                        vue.toDisplayString(item.dateLabel) + " · " + vue.toDisplayString(item.abnormalCount) + " 项异常",
                        1
                        /* TEXT */
                      )
                    ]),
                    item.status === "pending_ask" ? (vue.openBlock(), vue.createBlock($setup["JdAvatar"], {
                      key: 0,
                      text: "问",
                      color: "owner",
                      size: "xs"
                    })) : vue.createCommentVNode("v-if", true)
                  ], 8, ["onClick"]);
                }),
                128
                /* KEYED_FRAGMENT */
              ))
            ])
          ])
        ]),
        _: 1
        /* STABLE */
      }, 8, ["show"])
    ]);
  }
  const PagesReportReport = /* @__PURE__ */ _export_sfc(_sfc_main$5, [["render", _sfc_render$4], ["__scopeId", "data-v-e12457dc"], ["__file", "D:/workZone/APP/frontend/src/pages/report/report.vue"]]);
  const _sfc_main$4 = {
    __name: "widget",
    setup(__props, { expose: __expose }) {
      __expose();
      const widget = vue.ref({ familyName: "李家", dateLabel: "", pendingCount: 0, tasks: [] });
      const settings2 = vue.ref({
        size: "medium",
        showTasks: true,
        showClaimCount: true,
        showNextCheckup: true,
        showHealth: false,
        liveActivity: true
      });
      const nextCheckupText = vue.ref("11/24");
      const visibleTasks = vue.computed(() => {
        if (!settings2.value.showTasks)
          return [];
        const limit = settings2.value.size === "large" ? 3 : 2;
        return (widget.value.tasks || []).slice(0, limit);
      });
      vue.onMounted(async () => {
        try {
          widget.value = await homeApi.widget();
        } catch (e) {
        }
        try {
          const res = await settingApi.get();
          settings2.value = { ...settings2.value, ...res.widget };
        } catch (e) {
        }
        try {
          const overview = await homeApi.overview();
          nextCheckupText.value = formatCheckup(
            overview.elder ? overview.elder.nextCheckup : "",
            overview.kpi ? overview.kpi.nextCheckupDays : null
          );
        } catch (e) {
        }
      });
      function formatCheckup(iso, days) {
        if (!iso)
          return "未设置";
        const date2 = `${Number(iso.slice(5, 7))}/${Number(iso.slice(8, 10))}`;
        if (days === null || days === void 0)
          return date2;
        if (days < 0)
          return `${date2} · 已过期`;
        if (days === 0)
          return `${date2} · 今天`;
        if (days === 1)
          return `${date2} · 明天`;
        return `${date2} · ${days} 天后`;
      }
      async function setSize(size) {
        settings2.value.size = size;
        save({ size });
      }
      async function save(patch) {
        try {
          await settingApi.widget(patch);
        } catch (e) {
        }
      }
      const __returned__ = { widget, settings: settings2, nextCheckupText, visibleTasks, formatCheckup, setSize, save, ref: vue.ref, computed: vue.computed, onMounted: vue.onMounted, JdNav, JdSwitch, get homeApi() {
        return homeApi;
      }, get settingApi() {
        return settingApi;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$3(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "jd-page" }, [
      vue.createVNode($setup["JdNav"], {
        title: "桌面小组件",
        back: ""
      }),
      vue.createElementVNode("scroll-view", {
        class: "jd-body scroll",
        "scroll-y": "",
        "show-scrollbar": false
      }, [
        vue.createElementVNode("view", { class: "t12 c2 sb mb10" }, "预览"),
        vue.createElementVNode(
          "view",
          {
            class: vue.normalizeClass(["widget-card", $setup.settings.size])
          },
          [
            vue.createElementVNode("view", { class: "between" }, [
              vue.createElementVNode(
                "text",
                { class: "w-sub" },
                "家灯 · " + vue.toDisplayString($setup.widget.familyName || "李家"),
                1
                /* TEXT */
              ),
              vue.createElementVNode(
                "text",
                { class: "w-sub" },
                vue.toDisplayString($setup.widget.dateLabel),
                1
                /* TEXT */
              )
            ]),
            vue.createElementVNode("view", { class: "row g8 mt10 baseline" }, [
              vue.createElementVNode(
                "text",
                { class: "w-big" },
                vue.toDisplayString($setup.widget.pendingCount),
                1
                /* TEXT */
              ),
              vue.createElementVNode("text", { class: "w-sub" }, "件事等人接")
            ]),
            $setup.settings.size !== "small" ? (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              { key: 0 },
              vue.renderList($setup.visibleTasks, (task) => {
                return vue.openBlock(), vue.createElementBlock(
                  "view",
                  {
                    key: task.id,
                    class: vue.normalizeClass(["w-task", { first: task === $setup.visibleTasks[0] }])
                  },
                  [
                    vue.createElementVNode(
                      "text",
                      { class: "w-time num" },
                      vue.toDisplayString(task.time),
                      1
                      /* TEXT */
                    ),
                    vue.createElementVNode(
                      "text",
                      { class: "w-title" },
                      vue.toDisplayString(task.title) + " · " + vue.toDisplayString(task.assignee ? task.assignee.name : "待认领"),
                      1
                      /* TEXT */
                    )
                  ],
                  2
                  /* CLASS */
                );
              }),
              128
              /* KEYED_FRAGMENT */
            )) : vue.createCommentVNode("v-if", true),
            $setup.settings.size === "large" && $setup.settings.showNextCheckup ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 1,
              class: "w-foot"
            }, [
              vue.createElementVNode(
                "text",
                { class: "w-sub" },
                "下次复查 " + vue.toDisplayString($setup.nextCheckupText),
                1
                /* TEXT */
              )
            ])) : vue.createCommentVNode("v-if", true)
          ],
          2
          /* CLASS */
        ),
        vue.createElementVNode("view", { class: "t12 c2 sb mt20 mb8" }, "尺寸"),
        vue.createElementVNode("view", { class: "row g8" }, [
          vue.createElementVNode(
            "view",
            {
              class: vue.normalizeClass(["chip", { on: $setup.settings.size === "small" }]),
              onClick: _cache[0] || (_cache[0] = ($event) => $setup.setSize("small"))
            },
            "小号 2×2",
            2
            /* CLASS */
          ),
          vue.createElementVNode(
            "view",
            {
              class: vue.normalizeClass(["chip", { on: $setup.settings.size === "medium" }]),
              onClick: _cache[1] || (_cache[1] = ($event) => $setup.setSize("medium"))
            },
            "中号 4×2",
            2
            /* CLASS */
          ),
          vue.createElementVNode(
            "view",
            {
              class: vue.normalizeClass(["chip", { on: $setup.settings.size === "large" }]),
              onClick: _cache[2] || (_cache[2] = ($event) => $setup.setSize("large"))
            },
            "大号 4×4",
            2
            /* CLASS */
          )
        ]),
        vue.createElementVNode("view", { class: "t12 c2 sb mt20 mb8" }, "在小组件上显示"),
        vue.createElementVNode("view", { class: "list" }, [
          vue.createElementVNode("view", { class: "li" }, [
            vue.createElementVNode("text", { class: "lb" }, "今日任务"),
            vue.createVNode($setup["JdSwitch"], {
              modelValue: $setup.settings.showTasks,
              "onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => $setup.settings.showTasks = $event),
              style: { "margin-left": "auto" },
              onChange: _cache[4] || (_cache[4] = (v) => $setup.save({ show_tasks: v }))
            }, null, 8, ["modelValue"])
          ]),
          vue.createElementVNode("view", { class: "li" }, [
            vue.createElementVNode("text", { class: "lb" }, "待认领数量"),
            vue.createVNode($setup["JdSwitch"], {
              modelValue: $setup.settings.showClaimCount,
              "onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => $setup.settings.showClaimCount = $event),
              style: { "margin-left": "auto" },
              onChange: _cache[6] || (_cache[6] = (v) => $setup.save({ show_claim_count: v }))
            }, null, 8, ["modelValue"])
          ]),
          vue.createElementVNode("view", { class: "li" }, [
            vue.createElementVNode("text", { class: "lb" }, "下次复查倒计时"),
            vue.createVNode($setup["JdSwitch"], {
              modelValue: $setup.settings.showNextCheckup,
              "onUpdate:modelValue": _cache[7] || (_cache[7] = ($event) => $setup.settings.showNextCheckup = $event),
              style: { "margin-left": "auto" },
              onChange: _cache[8] || (_cache[8] = (v) => $setup.save({ show_next_checkup: v }))
            }, null, 8, ["modelValue"])
          ]),
          vue.createElementVNode("view", { class: "li" }, [
            vue.createElementVNode("view", { class: "f1" }, [
              vue.createElementVNode("text", { class: "lb" }, "长辈健康数据"),
              vue.createElementVNode("view", { class: "t11 c3 mt4" }, "仅自己可见")
            ]),
            vue.createVNode($setup["JdSwitch"], {
              modelValue: $setup.settings.showHealth,
              "onUpdate:modelValue": _cache[9] || (_cache[9] = ($event) => $setup.settings.showHealth = $event),
              style: { "margin-left": "auto" },
              onChange: _cache[10] || (_cache[10] = (v) => $setup.save({ show_health: v }))
            }, null, 8, ["modelValue"])
          ])
        ]),
        vue.createElementVNode("view", { class: "t12 c2 sb mt20 mb8" }, "锁屏实时活动"),
        vue.createElementVNode("view", { class: "card tight" }, [
          vue.createElementVNode("view", { class: "between" }, [
            vue.createElementVNode("text", { class: "t13 sb" }, "任务进行中显示进度"),
            vue.createVNode($setup["JdSwitch"], {
              modelValue: $setup.settings.liveActivity,
              "onUpdate:modelValue": _cache[11] || (_cache[11] = ($event) => $setup.settings.liveActivity = $event),
              onChange: _cache[12] || (_cache[12] = (v) => $setup.save({ live_activity: v }))
            }, null, 8, ["modelValue"])
          ]),
          vue.createElementVNode("view", { class: "t11 c3 mt6" }, "例如「陪爸爸复查 · 已到院 09:12」，结束后自动消失。")
        ]),
        vue.createElementVNode("view", { class: "disc mt14" }, [
          vue.createElementVNode("text", { class: "b" }, "小组件不放健康数据。"),
          vue.createTextVNode(" 手机放在桌上时，别人也能看到屏幕。默认关闭，需要手动开。 ")
        ])
      ])
    ]);
  }
  const PagesWidgetWidget = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["render", _sfc_render$3], ["__scopeId", "data-v-f54cac00"], ["__file", "D:/workZone/APP/frontend/src/pages/widget/widget.vue"]]);
  const scriptRel = "modulepreload";
  const assetsURL = function(dep) {
    return "/" + dep;
  };
  const seen = {};
  const __vitePreload = function preload(baseModule, deps, importerUrl) {
    let promise2 = Promise.resolve();
    if (false) {
      document.getElementsByTagName("link");
      const cspNonceMeta = document.querySelector("meta[property=csp-nonce]");
      const cspNonce = (cspNonceMeta == null ? void 0 : cspNonceMeta.nonce) || (cspNonceMeta == null ? void 0 : cspNonceMeta.getAttribute("nonce"));
      promise2 = Promise.all(deps.map((dep) => {
        dep = assetsURL(dep);
        if (dep in seen)
          return;
        seen[dep] = true;
        const isCss = dep.endsWith(".css");
        const cssSelector = isCss ? '[rel="stylesheet"]' : "";
        if (document.querySelector(`link[href="${dep}"]${cssSelector}`)) {
          return;
        }
        const link = document.createElement("link");
        link.rel = isCss ? "stylesheet" : scriptRel;
        if (!isCss) {
          link.as = "script";
          link.crossOrigin = "";
        }
        link.href = dep;
        if (cspNonce) {
          link.setAttribute("nonce", cspNonce);
        }
        document.head.appendChild(link);
        if (isCss) {
          return new Promise((res, rej) => {
            link.addEventListener("load", res);
            link.addEventListener("error", () => rej(new Error(`Unable to preload CSS for ${dep}`)));
          });
        }
      }));
    }
    return promise2.then(() => baseModule()).catch((err) => {
      const e = new Event("vite:preloadError", { cancelable: true });
      e.payload = err;
      window.dispatchEvent(e);
      if (!e.defaultPrevented) {
        throw err;
      }
    });
  };
  const _sfc_main$3 = {
    __name: "settings",
    setup(__props, { expose: __expose }) {
      __expose();
      const session$1 = useSession();
      const data = vue.ref(null);
      const quiet = vue.ref({ enabled: true, start: "22:00", end: "08:00", urgentPass: true });
      const showCache = vue.ref(false);
      const showPrivacy = vue.ref(false);
      const isElder2 = vue.computed(() => session$1.member && session$1.member.role === "elder");
      vue.onMounted(load);
      onShow(() => {
        if (session$1.token)
          load();
      });
      async function load() {
        try {
          const res = await settingApi.get();
          data.value = res;
          quiet.value = { ...res.quiet };
        } catch (e) {
        }
      }
      async function saveNotify(patch) {
        try {
          const res = await settingApi.notifications(patch);
          if (data.value) {
            data.value.channels = res.channels;
            data.value.events = res.events;
            quiet.value = { ...res.quiet };
          }
        } catch (e) {
          load();
        }
      }
      async function testNotification() {
        try {
          const logs = await settingApi.test();
          const first = logs && logs[0];
          if (!first)
            return;
          const label = first.status === "skipped_quiet" ? "当前处于静默时段，非紧急提醒会被挡下" : first.status === "sent" ? `已通过「${first.channelLabel || first.channel}」投递` : "所有渠道都关闭了";
          uni.showModal({ title: "测试提醒", content: label, showCancel: false });
          load();
        } catch (e) {
        }
      }
      function clearCache() {
        uni.showModal({
          title: "清空缓存",
          content: "离线缓存会重新从云端拉取，不影响任何记录。",
          success: (res) => {
            if (res.confirm) {
              uni.showToast({ title: "缓存已清空", icon: "none" });
              showCache.value = false;
            }
          }
        });
      }
      function logout() {
        uni.showModal({
          title: "退出登录",
          content: "退出后需要重新面容解锁。记录不会丢失。",
          success: async (res) => {
            if (!res.confirm)
              return;
            try {
              await authApi.logout();
            } catch (e) {
            }
            const { clearSession: clearSession2 } = await __vitePreload(() => Promise.resolve().then(() => session), false ? "__VITE_PRELOAD__" : void 0);
            clearSession2();
            uni.reLaunch({ url: "/pages/launch/launch" });
          }
        });
      }
      function go2(url2) {
        uni.navigateTo({ url: url2 });
      }
      const __returned__ = { session: session$1, data, quiet, showCache, showPrivacy, isElder: isElder2, load, saveNotify, testNotification, clearCache, logout, go: go2, ref: vue.ref, computed: vue.computed, onMounted: vue.onMounted, get onShow() {
        return onShow;
      }, JdNav, JdTabbar, JdAvatar, JdSwitch, get settingApi() {
        return settingApi;
      }, get authApi() {
        return authApi;
      }, get useSession() {
        return useSession;
      }, get setSession() {
        return setSession;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$2(_ctx, _cache, $props, $setup, $data, $options) {
    const _component_u_popup = resolveEasycom(vue.resolveDynamicComponent("u-popup"), __easycom_0$1);
    return vue.openBlock(), vue.createElementBlock("view", { class: "jd-page" }, [
      vue.createVNode($setup["JdNav"], { title: "我的" }),
      vue.createElementVNode("scroll-view", {
        class: "jd-body scroll",
        "scroll-y": "",
        "show-scrollbar": false
      }, [
        !$setup.isElder && $setup.data ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "card mt6",
          onClick: _cache[0] || (_cache[0] = ($event) => $setup.go("/pages/vip/vip"))
        }, [
          vue.createElementVNode("view", { class: "row g12" }, [
            vue.createVNode($setup["JdAvatar"], {
              text: $setup.data.user.avatarText,
              color: $setup.data.user.avatarColor,
              size: "lg"
            }, null, 8, ["text", "color"]),
            vue.createElementVNode("view", { class: "f1" }, [
              vue.createElementVNode(
                "text",
                { class: "t17 b" },
                vue.toDisplayString($setup.data.user.name),
                1
                /* TEXT */
              ),
              vue.createElementVNode(
                "view",
                { class: "t11 c3 mt4" },
                vue.toDisplayString($setup.data.family.name) + " · " + vue.toDisplayString($setup.data.user.relation) + " · " + vue.toDisplayString($setup.data.membership.label),
                1
                /* TEXT */
              )
            ]),
            vue.createElementVNode("text", { class: "chev" }, "›")
          ])
        ])) : vue.createCommentVNode("v-if", true),
        vue.createElementVNode("view", { class: "t12 c2 sb mt18 mb8" }, "提醒渠道"),
        vue.createElementVNode("view", { class: "list" }, [
          (vue.openBlock(true), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($setup.data && $setup.data.channels, (ch) => {
              return vue.openBlock(), vue.createElementBlock("view", {
                key: ch.key,
                class: "li"
              }, [
                vue.createElementVNode("view", { class: "f1" }, [
                  vue.createElementVNode(
                    "text",
                    { class: "lb" },
                    vue.toDisplayString(ch.label),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode(
                    "view",
                    { class: "t11 c3 mt4" },
                    vue.toDisplayString(ch.hint),
                    1
                    /* TEXT */
                  )
                ]),
                vue.createVNode($setup["JdSwitch"], {
                  modelValue: ch.on,
                  "onUpdate:modelValue": ($event) => ch.on = $event,
                  style: { "margin-left": "auto" },
                  onChange: (v) => $setup.saveNotify({ [ch.key]: v })
                }, null, 8, ["modelValue", "onUpdate:modelValue", "onChange"])
              ]);
            }),
            128
            /* KEYED_FRAGMENT */
          ))
        ]),
        vue.createElementVNode("view", { class: "card flat tight mt8 notice" }, [
          vue.createElementVNode(
            "text",
            {
              class: "t11 c2",
              style: { "line-height": "17px" }
            },
            vue.toDisplayString($setup.data ? $setup.data.degradeChain : ""),
            1
            /* TEXT */
          )
        ]),
        vue.createElementVNode("view", { class: "t12 c2 sb mt18 mb8" }, "什么情况提醒我"),
        vue.createElementVNode("view", { class: "list" }, [
          (vue.openBlock(true), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($setup.data && $setup.data.events, (ev) => {
              return vue.openBlock(), vue.createElementBlock("view", {
                key: ev.key,
                class: "li"
              }, [
                vue.createElementVNode(
                  "text",
                  { class: "lb" },
                  vue.toDisplayString(ev.label),
                  1
                  /* TEXT */
                ),
                vue.createVNode($setup["JdSwitch"], {
                  modelValue: ev.on,
                  "onUpdate:modelValue": ($event) => ev.on = $event,
                  style: { "margin-left": "auto" },
                  onChange: (v) => $setup.saveNotify({ [ev.key]: v })
                }, null, 8, ["modelValue", "onUpdate:modelValue", "onChange"])
              ]);
            }),
            128
            /* KEYED_FRAGMENT */
          ))
        ]),
        vue.createElementVNode("view", { class: "t12 c2 sb mt18 mb8" }, "静默时段"),
        vue.createElementVNode("view", { class: "list" }, [
          vue.createElementVNode("view", { class: "li" }, [
            vue.createElementVNode("text", { class: "lb" }, "开启静默"),
            vue.createElementVNode("view", { class: "vl row g6" }, [
              vue.createElementVNode("picker", {
                mode: "time",
                value: $setup.quiet.start,
                onChange: _cache[1] || (_cache[1] = (e) => $setup.saveNotify({ quiet_start: e.detail.value }))
              }, [
                vue.createElementVNode(
                  "text",
                  { class: "num" },
                  vue.toDisplayString($setup.quiet.start),
                  1
                  /* TEXT */
                )
              ], 40, ["value"]),
              vue.createElementVNode("text", null, "–"),
              vue.createElementVNode("picker", {
                mode: "time",
                value: $setup.quiet.end,
                onChange: _cache[2] || (_cache[2] = (e) => $setup.saveNotify({ quiet_end: e.detail.value }))
              }, [
                vue.createElementVNode(
                  "text",
                  { class: "num" },
                  vue.toDisplayString($setup.quiet.end),
                  1
                  /* TEXT */
                )
              ], 40, ["value"])
            ]),
            vue.createVNode($setup["JdSwitch"], {
              modelValue: $setup.quiet.enabled,
              "onUpdate:modelValue": _cache[3] || (_cache[3] = ($event) => $setup.quiet.enabled = $event),
              style: { "margin-left": "10px" },
              onChange: _cache[4] || (_cache[4] = (v) => $setup.saveNotify({ quiet_enabled: v }))
            }, null, 8, ["modelValue"])
          ]),
          vue.createElementVNode("view", { class: "li" }, [
            vue.createElementVNode("view", { class: "f1" }, [
              vue.createElementVNode("text", { class: "lb" }, "紧急任务可穿透"),
              vue.createElementVNode("view", { class: "t11 c3 mt4" }, "需主理手动标记")
            ]),
            vue.createVNode($setup["JdSwitch"], {
              modelValue: $setup.quiet.urgentPass,
              "onUpdate:modelValue": _cache[5] || (_cache[5] = ($event) => $setup.quiet.urgentPass = $event),
              style: { "margin-left": "auto" },
              onChange: _cache[6] || (_cache[6] = (v) => $setup.saveNotify({ urgent_pass: v }))
            }, null, 8, ["modelValue"])
          ])
        ]),
        vue.createElementVNode("view", { class: "t12 c2 sb mt18 mb8" }, "系统"),
        vue.createElementVNode("view", { class: "list" }, [
          vue.createElementVNode("view", {
            class: "li",
            onClick: _cache[7] || (_cache[7] = ($event) => $setup.go("/pages/widget/widget"))
          }, [
            vue.createElementVNode("text", { class: "lb" }, "桌面小组件"),
            vue.createElementVNode("text", { class: "chev" }, "›")
          ]),
          vue.createElementVNode("view", {
            class: "li",
            onClick: _cache[8] || (_cache[8] = ($event) => $setup.showCache = true)
          }, [
            vue.createElementVNode("text", { class: "lb" }, "离线缓存"),
            vue.createElementVNode(
              "text",
              { class: "vl" },
              vue.toDisplayString($setup.data ? $setup.data.system.cache.tasks : 0) + " 条 · " + vue.toDisplayString($setup.data ? $setup.data.system.cache.sizeLabel : ""),
              1
              /* TEXT */
            ),
            vue.createElementVNode("text", { class: "chev" }, "›")
          ]),
          vue.createElementVNode("view", {
            class: "li",
            onClick: _cache[9] || (_cache[9] = ($event) => $setup.showPrivacy = true)
          }, [
            vue.createElementVNode("text", { class: "lb" }, "隐私与数据"),
            vue.createElementVNode("text", { class: "chev" }, "›")
          ]),
          vue.createElementVNode("view", {
            class: "li",
            onClick: _cache[10] || (_cache[10] = ($event) => $setup.go("/pages/elder/elder"))
          }, [
            vue.createElementVNode("view", { class: "f1" }, [
              vue.createElementVNode("text", { class: "lb" }, "关怀版模式"),
              vue.createElementVNode("view", { class: "t11 c3 mt4" }, "正文 26sp · 一屏一卡 · 关闭非必要动效")
            ]),
            vue.createElementVNode("text", { class: "chev" }, "›")
          ])
        ]),
        vue.createElementVNode("view", { class: "row g8 mt14" }, [
          vue.createElementVNode("button", {
            class: "btn btn-ghost",
            style: { "flex": "1" },
            onClick: $setup.testNotification
          }, "测试提醒链路"),
          vue.createElementVNode("button", {
            class: "btn btn-sunk",
            style: { "flex": "1" },
            onClick: $setup.logout
          }, "退出登录")
        ]),
        vue.createElementVNode(
          "view",
          { class: "t11 c4 tc mt18" },
          "家灯 v" + vue.toDisplayString($setup.data ? $setup.data.system.version : "1.1.0") + " · 只做协作，不做诊断",
          1
          /* TEXT */
        )
      ]),
      vue.createVNode($setup["JdTabbar"], { active: "me" }),
      vue.createVNode(_component_u_popup, {
        show: $setup.showCache,
        "onUpdate:show": _cache[11] || (_cache[11] = ($event) => $setup.showCache = $event),
        mode: "bottom",
        round: "20",
        safeAreaInsetBottom: true
      }, {
        default: vue.withCtx(() => [
          vue.createElementVNode("view", { class: "pop" }, [
            vue.createElementVNode("view", { class: "pop-title" }, "离线缓存"),
            vue.createElementVNode("view", { class: "t11 c3 mb10" }, "没有网络也能看任务与打卡，联网后自动补传。"),
            vue.createElementVNode("view", { class: "list" }, [
              vue.createElementVNode("view", { class: "li" }, [
                vue.createElementVNode("text", { class: "lb" }, "缓存任务"),
                vue.createElementVNode(
                  "text",
                  { class: "vl" },
                  vue.toDisplayString($setup.data ? $setup.data.system.cache.tasks : 0) + " 条",
                  1
                  /* TEXT */
                )
              ]),
              vue.createElementVNode("view", { class: "li" }, [
                vue.createElementVNode("text", { class: "lb" }, "占用空间"),
                vue.createElementVNode(
                  "text",
                  { class: "vl" },
                  vue.toDisplayString($setup.data ? $setup.data.system.cache.sizeLabel : ""),
                  1
                  /* TEXT */
                )
              ]),
              vue.createElementVNode("view", { class: "li" }, [
                vue.createElementVNode("text", { class: "lb" }, "最近同步"),
                vue.createElementVNode(
                  "text",
                  { class: "vl num" },
                  vue.toDisplayString($setup.data ? $setup.data.system.lastSyncAt.replace("T", " ").slice(0, 16) : ""),
                  1
                  /* TEXT */
                )
              ])
            ]),
            vue.createElementVNode("button", {
              class: "btn btn-ghost mt14",
              onClick: $setup.clearCache
            }, "清空缓存")
          ])
        ]),
        _: 1
        /* STABLE */
      }, 8, ["show"]),
      vue.createVNode(_component_u_popup, {
        show: $setup.showPrivacy,
        "onUpdate:show": _cache[13] || (_cache[13] = ($event) => $setup.showPrivacy = $event),
        mode: "bottom",
        round: "20",
        safeAreaInsetBottom: true
      }, {
        default: vue.withCtx(() => [
          vue.createElementVNode("view", { class: "pop" }, [
            vue.createElementVNode("view", { class: "pop-title" }, "隐私与数据"),
            vue.createElementVNode("view", { class: "list mt10" }, [
              vue.createElementVNode("view", { class: "li" }, [
                vue.createElementVNode("view", { class: "f1" }, [
                  vue.createElementVNode("text", { class: "lb" }, "健康档案加密"),
                  vue.createElementVNode("view", { class: "t11 c3 mt4" }, "解锁后才能查看")
                ]),
                vue.createElementVNode("text", { class: "t11 cok" }, "已开启")
              ]),
              vue.createElementVNode("view", {
                class: "li",
                onClick: _cache[12] || (_cache[12] = ($event) => $setup.go("/pages/profile/profile"))
              }, [
                vue.createElementVNode("text", { class: "lb" }, "谁看过我的档案"),
                vue.createElementVNode("text", { class: "chev" }, "›")
              ]),
              vue.createElementVNode("view", { class: "li" }, [
                vue.createElementVNode("view", { class: "f1" }, [
                  vue.createElementVNode("text", { class: "lb" }, "定位与轨迹"),
                  vue.createElementVNode("view", { class: "t11 c3 mt4" }, "家灯明确不做")
                ]),
                vue.createElementVNode("text", { class: "t11 c3" }, "不采集")
              ])
            ]),
            vue.createElementVNode("view", { class: "disc mt12" }, "导出、导出给医生、查看档案都会留痕，长辈本人可见。")
          ])
        ]),
        _: 1
        /* STABLE */
      }, 8, ["show"])
    ]);
  }
  const PagesSettingsSettings = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["render", _sfc_render$2], ["__scopeId", "data-v-6d719173"], ["__file", "D:/workZone/APP/frontend/src/pages/settings/settings.vue"]]);
  const _sfc_main$2 = {
    __name: "vip",
    setup(__props, { expose: __expose }) {
      __expose();
      const data = vue.ref(null);
      const benefits = vue.ref([
        { icon: "doc", label: "记录导出 PDF", hint: "给医生看时不用翻手机", tag: "常用" },
        { icon: "bell", label: "短信提醒", hint: "推送失败时的兜底，长辈也能收到" },
        { icon: "chart", label: "4 位长辈档案", hint: "爸妈各一份，不用来回切换账号" }
      ]);
      const paying = vue.ref(false);
      vue.onMounted(load);
      async function load() {
        try {
          const res = await vipApi.get();
          data.value = res;
          benefits.value = res.benefits;
        } catch (e) {
        }
      }
      async function buy() {
        if (paying.value)
          return;
        paying.value = true;
        try {
          const order = await vipApi.order({ channel: "wxpay" });
          uni.showLoading({ title: "正在支付…", mask: true });
          await new Promise((resolve) => setTimeout(resolve, 700));
          const res = await vipApi.pay(order.outTradeNo);
          uni.hideLoading();
          uni.showModal({
            title: "开通成功",
            content: `家庭会员已生效，到期 ${(res.membership.expiresAt || "").slice(0, 10)}。7 天内可无理由退款。`,
            showCancel: false
          });
          load();
        } catch (e) {
          uni.hideLoading();
        } finally {
          paying.value = false;
        }
      }
      function refund() {
        uni.showModal({
          title: "申请退款",
          content: "退款后会员权益立即停止，历史数据只读保留，不会删除。",
          success: async (res) => {
            if (!res.confirm)
              return;
            try {
              await vipApi.refund();
              uni.showToast({ title: "已退款，数据保留只读", icon: "none" });
              load();
            } catch (e) {
            }
          }
        });
      }
      const __returned__ = { data, benefits, paying, load, buy, refund, ref: vue.ref, onMounted: vue.onMounted, JdNav, JdIcon, get vipApi() {
        return vipApi;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render$1(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "jd-page" }, [
      vue.createVNode($setup["JdNav"], {
        title: "家庭会员",
        back: ""
      }),
      vue.createElementVNode("scroll-view", {
        class: "jd-body scroll",
        "scroll-y": "",
        "show-scrollbar": false
      }, [
        vue.createElementVNode("view", { class: "card dark price-card mt6" }, [
          vue.createElementVNode("view", { class: "between" }, [
            vue.createElementVNode("view", null, [
              vue.createElementVNode("text", {
                class: "t11",
                style: { "opacity": "0.72" }
              }, "家庭会员"),
              vue.createElementVNode("view", { class: "row g8 mt6 baseline" }, [
                vue.createElementVNode(
                  "text",
                  { class: "t32 b" },
                  vue.toDisplayString($setup.data ? $setup.data.price.label : "99"),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode(
                  "text",
                  { class: "t14" },
                  vue.toDisplayString($setup.data ? $setup.data.price.unit : "元 / 年"),
                  1
                  /* TEXT */
                )
              ])
            ]),
            vue.createElementVNode("view", { class: "tag light" }, "≈8.3 元/月")
          ]),
          vue.createElementVNode(
            "view",
            { class: "t12 mt8 muted" },
            vue.toDisplayString($setup.data ? $setup.data.included : ""),
            1
            /* TEXT */
          )
        ]),
        $setup.data && $setup.data.active ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 0,
          class: "card flat tight mt10 active-card"
        }, [
          vue.createElementVNode("view", { class: "row g8" }, [
            vue.createVNode($setup["JdIcon"], {
              name: "shield",
              size: 18,
              color: "#0F7B4F"
            }),
            vue.createElementVNode("view", { class: "f1" }, [
              vue.createElementVNode("text", { class: "t13 sb cok" }, "会员生效中"),
              vue.createElementVNode(
                "view",
                { class: "t11 c3 mt2" },
                "到期 " + vue.toDisplayString($setup.data.membership.expiresAt.slice(0, 10)) + " · 不自动续费",
                1
                /* TEXT */
              )
            ]),
            $setup.data.membership.canRefund ? (vue.openBlock(), vue.createElementBlock("text", {
              key: 0,
              class: "t11 c3",
              onClick: $setup.refund
            }, "申请退款")) : vue.createCommentVNode("v-if", true)
          ])
        ])) : vue.createCommentVNode("v-if", true),
        vue.createElementVNode("view", { class: "t12 c2 sb mt18 mb8" }, "升级后对你最有用"),
        vue.createElementVNode("view", { class: "list" }, [
          (vue.openBlock(true), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($setup.benefits, (b) => {
              return vue.openBlock(), vue.createElementBlock("view", {
                key: b.label,
                class: "li"
              }, [
                vue.createVNode($setup["JdIcon"], {
                  name: b.icon,
                  size: 20,
                  color: "#7A6E63"
                }, null, 8, ["name"]),
                vue.createElementVNode("view", { class: "f1" }, [
                  vue.createElementVNode(
                    "text",
                    { class: "lb" },
                    vue.toDisplayString(b.label),
                    1
                    /* TEXT */
                  ),
                  vue.createElementVNode(
                    "view",
                    { class: "t11 c3 mt4" },
                    vue.toDisplayString(b.hint),
                    1
                    /* TEXT */
                  )
                ]),
                b.tag ? (vue.openBlock(), vue.createElementBlock(
                  "view",
                  {
                    key: 0,
                    class: "tag brand"
                  },
                  vue.toDisplayString(b.tag),
                  1
                  /* TEXT */
                )) : vue.createCommentVNode("v-if", true)
              ]);
            }),
            128
            /* KEYED_FRAGMENT */
          ))
        ]),
        $setup.data ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 1,
          class: "table mt16"
        }, [
          vue.createElementVNode("view", { class: "tr head" }, [
            vue.createElementVNode("text", { class: "td" }, "权益"),
            vue.createElementVNode("text", { class: "td" }, "免费"),
            vue.createElementVNode("text", { class: "td" }, "会员")
          ]),
          (vue.openBlock(true), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($setup.data.table, (row) => {
              return vue.openBlock(), vue.createElementBlock("view", {
                key: row.label,
                class: "tr"
              }, [
                vue.createElementVNode(
                  "text",
                  { class: "td" },
                  vue.toDisplayString(row.label),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode(
                  "text",
                  { class: "td" },
                  vue.toDisplayString(row.free),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode(
                  "text",
                  { class: "td" },
                  vue.toDisplayString(row.vip),
                  1
                  /* TEXT */
                )
              ]);
            }),
            128
            /* KEYED_FRAGMENT */
          ))
        ])) : vue.createCommentVNode("v-if", true),
        vue.createElementVNode("view", { class: "card flat mt14 policy" }, [
          vue.createElementVNode(
            "text",
            {
              class: "t11 c2",
              style: { "line-height": "18px" }
            },
            vue.toDisplayString($setup.data ? $setup.data.policy : ""),
            1
            /* TEXT */
          )
        ]),
        $setup.data ? (vue.openBlock(), vue.createElementBlock("view", {
          key: 2,
          class: "quota-row mt12"
        }, [
          vue.createElementVNode(
            "text",
            { class: "t11 c3" },
            "本月已导出 " + vue.toDisplayString($setup.data.quota.exports.used) + " 次 · 还可导出 " + vue.toDisplayString($setup.data.quota.exports.left) + " 次",
            1
            /* TEXT */
          )
        ])) : vue.createCommentVNode("v-if", true),
        vue.createElementVNode("view", {
          class: "t11 c3 mt12",
          style: { "line-height": "18px" }
        }, " 会员入口在长辈端不可见；App 也没有长辈付费入口。 ")
      ]),
      vue.createElementVNode("view", { class: "actionbar" }, [
        !$setup.data || !$setup.data.active ? (vue.openBlock(), vue.createElementBlock("button", {
          key: 0,
          class: "btn btn-primary",
          disabled: $setup.paying,
          onClick: $setup.buy
        }, vue.toDisplayString($setup.paying ? "正在唤起支付…" : "99 元开通"), 9, ["disabled"])) : (vue.openBlock(), vue.createElementBlock("button", {
          key: 1,
          class: "btn btn-ghost",
          disabled: $setup.paying,
          onClick: $setup.buy
        }, "续费一年（99 元）", 8, ["disabled"]))
      ])
    ]);
  }
  const PagesVipVip = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["render", _sfc_render$1], ["__scopeId", "data-v-6afb8583"], ["__file", "D:/workZone/APP/frontend/src/pages/vip/vip.vue"]]);
  const _sfc_main$1 = {
    __name: "elder",
    setup(__props, { expose: __expose }) {
      __expose();
      const session2 = useSession();
      const tasks = vue.ref([]);
      const loading = vue.ref(true);
      const bigger = vue.ref(false);
      const firstOpenId = vue.computed(() => {
        const open = tasks.value.find((t) => !["done", "pending_confirm"].includes(t.status));
        return open ? open.id : 0;
      });
      const compare = [
        ["正文", "15sp", "24–26sp"],
        ["主按钮高", "48", "120"],
        ["一屏卡片", "2–3 张", "1 张"],
        ["导航", "5 tab", "无 tab，单页流"],
        ["动效", "有", "关闭非必要动效"]
      ];
      vue.onMounted(load);
      async function load() {
        try {
          const res = await homeApi.overview();
          tasks.value = res.todayTasks.filter((t) => t.status !== "cancelled" && t.status !== "skipped");
        } catch (e) {
        } finally {
          loading.value = false;
        }
      }
      function periodOf(time) {
        const h = Number((time || "00:00").slice(0, 2));
        if (h < 12)
          return "上午";
        if (h < 18)
          return "下午";
        return "晚上";
      }
      function isNow(task) {
        return task.id === firstOpenId.value;
      }
      async function finish(task) {
        if (!isNow(task)) {
          uni.showToast({ title: "这一件还没到时间，到点再按", icon: "none" });
          return;
        }
        try {
          await taskApi.start(task.id);
          const res = await taskApi.complete(task.id, { note: "长辈一键确认 · 无凭证（长辈端豁免）", attachments: [] });
          uni.showToast({ title: res.msg || "记下了，家人都能看到", icon: "none" });
          load();
        } catch (e) {
        }
      }
      function talk() {
        uni.showToast({ title: "正在录音…（演示）", icon: "none" });
      }
      async function backToStandard() {
        try {
          await settingApi.preferences({ careMode: "standard" });
          patchSession({ preferences: { ...session2.preferences || {}, careMode: "standard" } });
        } catch (e) {
          return;
        }
        if (session2.member && session2.member.role === "elder") {
          uni.reLaunch({ url: "/pages/home/home" });
        } else {
          uni.reLaunch({ url: "/pages/settings/settings" });
        }
      }
      const __returned__ = { session: session2, tasks, loading, bigger, firstOpenId, compare, load, periodOf, isNow, finish, talk, backToStandard, ref: vue.ref, computed: vue.computed, onMounted: vue.onMounted, JdNav, JdIcon, get homeApi() {
        return homeApi;
      }, get taskApi() {
        return taskApi;
      }, get settingApi() {
        return settingApi;
      }, get useSession() {
        return useSession;
      }, get patchSession() {
        return patchSession;
      } };
      Object.defineProperty(__returned__, "__isScriptSetup", { enumerable: false, value: true });
      return __returned__;
    }
  };
  function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
    return vue.openBlock(), vue.createElementBlock("view", { class: "jd-page elder-page" }, [
      vue.createVNode($setup["JdNav"], {
        title: "关怀版",
        back: ""
      }),
      vue.createElementVNode("scroll-view", {
        class: "jd-body scroll",
        "scroll-y": "",
        "show-scrollbar": false
      }, [
        vue.createElementVNode("view", { class: "card flat tight elder-tip" }, [
          vue.createElementVNode("text", {
            class: "t12 c2",
            style: { "line-height": "19px" }
          }, [
            vue.createElementVNode("text", { class: "b cbrand" }, "关怀版"),
            vue.createTextVNode(" 自动跟随系统字号，最大可到 32sp；主按钮固定 120 高，一屏只放一张卡。 ")
          ])
        ]),
        vue.createElementVNode(
          "view",
          {
            class: vue.normalizeClass(["elder", { xl: $setup.bigger }])
          },
          [
            vue.createElementVNode("view", { class: "t32 b mt12" }, "今天"),
            $setup.loading ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 0,
              class: "t17 c3 mt20"
            }, "正在看看今天要做什么…")) : vue.createCommentVNode("v-if", true),
            (vue.openBlock(true), vue.createElementBlock(
              vue.Fragment,
              null,
              vue.renderList($setup.tasks, (task) => {
                return vue.openBlock(), vue.createElementBlock("view", {
                  key: task.id,
                  class: "card elder-card mt12"
                }, [
                  vue.createElementVNode("view", { class: "between" }, [
                    vue.createElementVNode(
                      "text",
                      { class: "t26 b num" },
                      vue.toDisplayString(task.time),
                      1
                      /* TEXT */
                    ),
                    vue.createElementVNode(
                      "view",
                      { class: "tag brand big-tag" },
                      vue.toDisplayString($setup.periodOf(task.time)),
                      1
                      /* TEXT */
                    )
                  ]),
                  vue.createElementVNode(
                    "view",
                    { class: "t26 b mt8 elder-title" },
                    vue.toDisplayString(task.title),
                    1
                    /* TEXT */
                  ),
                  task.status === "done" ? (vue.openBlock(), vue.createElementBlock("view", {
                    key: 0,
                    class: "btn btn-ok elder-btn done-btn"
                  }, [
                    vue.createVNode($setup["JdIcon"], {
                      name: "check",
                      size: 30,
                      color: "#FFFFFF"
                    }),
                    vue.createElementVNode("text", null, "今天已经做完了")
                  ])) : task.status === "pending_confirm" ? (vue.openBlock(), vue.createElementBlock("view", {
                    key: 1,
                    class: "btn elder-btn pending-btn"
                  }, [
                    vue.createVNode($setup["JdIcon"], {
                      name: "clock",
                      size: 26,
                      color: "#0F7B4F"
                    }),
                    vue.createElementVNode("text", null, "已提交，等家人确认")
                  ])) : (vue.openBlock(), vue.createElementBlock("button", {
                    key: 2,
                    class: vue.normalizeClass(["btn elder-btn", task.id === $setup.firstOpenId ? "btn-primary" : "btn-ghost"]),
                    onClick: ($event) => $setup.finish(task)
                  }, vue.toDisplayString(task.id === $setup.firstOpenId ? "按一下，我做完了" : "还没到时间"), 11, ["onClick"]))
                ]);
              }),
              128
              /* KEYED_FRAGMENT */
            )),
            !$setup.loading && !$setup.tasks.length ? (vue.openBlock(), vue.createElementBlock("view", {
              key: 1,
              class: "card mt12 tc"
            }, [
              vue.createElementVNode("view", { class: "t26 b" }, "今天没有安排"),
              vue.createElementVNode("view", { class: "t17 c3 mt8" }, "可以歇一会儿")
            ])) : vue.createCommentVNode("v-if", true),
            vue.createElementVNode("view", { class: "row g8 mt12" }, [
              vue.createElementVNode("button", {
                class: "btn btn-ghost elder-small",
                onClick: $setup.talk
              }, [
                vue.createVNode($setup["JdIcon"], {
                  name: "mic",
                  size: 28,
                  color: "#171210"
                }),
                vue.createElementVNode("text", null, "说话")
              ]),
              vue.createElementVNode("button", {
                class: "btn btn-ghost elder-small",
                onClick: _cache[0] || (_cache[0] = ($event) => $setup.bigger = !$setup.bigger)
              }, [
                vue.createVNode($setup["JdIcon"], {
                  name: "sun",
                  size: 28,
                  color: "#171210"
                }),
                vue.createElementVNode(
                  "text",
                  null,
                  vue.toDisplayString($setup.bigger ? "字已更大" : "字更大"),
                  1
                  /* TEXT */
                )
              ])
            ])
          ],
          2
          /* CLASS */
        ),
        vue.createElementVNode("view", { class: "t12 c2 sb mt20 mb8" }, "与标准版差异"),
        vue.createElementVNode("view", { class: "table" }, [
          vue.createElementVNode("view", { class: "tr head" }, [
            vue.createElementVNode("text", { class: "td" }, "项"),
            vue.createElementVNode("text", { class: "td" }, "标准"),
            vue.createElementVNode("text", { class: "td" }, "关怀版")
          ]),
          (vue.openBlock(), vue.createElementBlock(
            vue.Fragment,
            null,
            vue.renderList($setup.compare, (row) => {
              return vue.createElementVNode("view", {
                key: row[0],
                class: "tr"
              }, [
                vue.createElementVNode(
                  "text",
                  { class: "td" },
                  vue.toDisplayString(row[0]),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode(
                  "text",
                  { class: "td" },
                  vue.toDisplayString(row[1]),
                  1
                  /* TEXT */
                ),
                vue.createElementVNode(
                  "text",
                  { class: "td" },
                  vue.toDisplayString(row[2]),
                  1
                  /* TEXT */
                )
              ]);
            }),
            64
            /* STABLE_FRAGMENT */
          ))
        ]),
        vue.createElementVNode("view", { class: "disc mt14" }, " 关怀版不是「老年模式」的降级，而是把同一件事说得更清楚：一屏一件事，一次一个字。 "),
        vue.createElementVNode("button", {
          class: "btn btn-ghost mt14",
          onClick: $setup.backToStandard
        }, "回到标准版")
      ])
    ]);
  }
  const PagesElderElder = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["render", _sfc_render], ["__scopeId", "data-v-04271ed2"], ["__file", "D:/workZone/APP/frontend/src/pages/elder/elder.vue"]]);
  __definePage("pages/launch/launch", PagesLaunchLaunch);
  __definePage("pages/home/home", PagesHomeHome);
  __definePage("pages/board/board", PagesBoardBoard);
  __definePage("pages/schedule/schedule", PagesScheduleSchedule);
  __definePage("pages/create/create", PagesCreateCreate);
  __definePage("pages/detail/detail", PagesDetailDetail);
  __definePage("pages/timeline/timeline", PagesTimelineTimeline);
  __definePage("pages/export/export", PagesExportExport);
  __definePage("pages/profile/profile", PagesProfileProfile);
  __definePage("pages/meds/meds", PagesMedsMeds);
  __definePage("pages/report/report", PagesReportReport);
  __definePage("pages/widget/widget", PagesWidgetWidget);
  __definePage("pages/settings/settings", PagesSettingsSettings);
  __definePage("pages/vip/vip", PagesVipVip);
  __definePage("pages/elder/elder", PagesElderElder);
  const needShims = [
    {
      name: "onWindowResize",
      fallback: function(_callback) {
      }
    },
    {
      name: "offWindowResize",
      fallback: function(_callback) {
      }
    }
  ];
  function applyUniApiShims() {
    if (typeof uni === "undefined")
      return;
    for (const { name, fallback } of needShims) {
      if (typeof uni[name] !== "function") {
        uni[name] = fallback;
      }
    }
  }
  let timeout = null;
  function debounce(func2, wait = 500, immediate = false) {
    if (timeout !== null)
      clearTimeout(timeout);
    if (immediate) {
      const callNow = !timeout;
      timeout = setTimeout(() => {
        timeout = null;
      }, wait);
      if (callNow)
        typeof func2 === "function" && func2();
    } else {
      timeout = setTimeout(() => {
        typeof func2 === "function" && func2();
      }, wait);
    }
  }
  let flag;
  function throttle(func2, wait = 500, immediate = true) {
    if (wait <= 0) {
      typeof func2 === "function" && func2();
      return;
    }
    if (immediate) {
      if (!flag) {
        flag = true;
        typeof func2 === "function" && func2();
        setTimeout(() => {
          flag = false;
        }, wait);
      }
    } else if (!flag) {
      flag = true;
      setTimeout(() => {
        flag = false;
        typeof func2 === "function" && func2();
      }, wait);
    }
  }
  function add(arg1, arg2) {
    var r1, r2, m;
    try {
      r1 = arg1.toString().split(".")[1].length;
    } catch (e) {
      r1 = 0;
    }
    try {
      r2 = arg2.toString().split(".")[1].length;
    } catch (e) {
      r2 = 0;
    }
    m = Math.pow(10, Math.max(r1, r2));
    return (arg1 * m + arg2 * m) / m;
  }
  function sub(arg1, arg2) {
    var r1, r2, m, n;
    try {
      r1 = arg1.toString().split(".")[1].length;
    } catch (e) {
      r1 = 0;
    }
    try {
      r2 = arg2.toString().split(".")[1].length;
    } catch (e) {
      r2 = 0;
    }
    m = Math.pow(10, Math.max(r1, r2));
    n = r1 >= r2 ? r1 : r2;
    return Math.abs(((arg1 * m - arg2 * m) / m).toFixed(n));
  }
  function mul(a, b) {
    var c = 0, d = a.toString(), e = b.toString();
    try {
      c += d.split(".")[1].length;
    } catch (f) {
    }
    try {
      c += e.split(".")[1].length;
    } catch (f) {
    }
    return Number(d.replace(".", "")) * Number(e.replace(".", "")) / Math.pow(10, c);
  }
  function div(a, b) {
    return divide(a, b);
  }
  const calc = {
    add,
    sub,
    mul,
    div
  };
  let platform = "none";
  platform = "vue3";
  platform = "plus";
  const platform$1 = platform;
  const settings = {
    lang: typeof uni !== "undefined" && typeof uni.getLocale === "function" ? uni.getLocale() : "zh-Hans"
  };
  if (typeof uni !== "undefined" && typeof uni.onLocaleChange === "function") {
    uni.onLocaleChange((locale) => {
      settings.lang = typeof locale === "string" ? locale : locale && locale.locale || settings.lang;
    });
  }
  const DEFAULT_LIGHT_THEME_COLORS = Object.freeze({
    primary: "#3c9cff",
    info: "#909399",
    warning: "#f9ae3d",
    error: "#f56c6c",
    success: "#5ac725",
    mainColor: "#303133",
    contentColor: "#606266",
    tipsColor: "#909193",
    lightColor: "#c0c4cc",
    borderColor: "#dadbde",
    bgColor: "#f3f4f6",
    disabledColor: "#c8c9cc",
    primaryDark: "#398ade",
    primaryDisabled: "#9acafc",
    primaryLight: "#ecf5ff",
    warningDark: "#f1a532",
    warningDisabled: "#f9d39b",
    warningLight: "#fdf6ec",
    successDark: "#53c21d",
    successDisabled: "#a9e08f",
    successLight: "#f5fff0",
    errorDark: "#e45656",
    errorDisabled: "#f7b2b2",
    errorLight: "#fef0f0",
    infoDark: "#767a82",
    infoDisabled: "#c4c6c9",
    infoLight: "#f4f4f5"
  });
  const DEFAULT_DARK_THEME_COLORS = Object.freeze({
    primary: "#3c9cff",
    info: "#909399",
    warning: "#f9ae3d",
    error: "#f56c6c",
    success: "#5ac725",
    mainColor: "#f5f5f5",
    contentColor: "#d1d5db",
    tipsColor: "#9ca3af",
    lightColor: "#6b7280",
    borderColor: "#3a3a3c",
    bgColor: "#1f1f1f",
    disabledColor: "#4b5563",
    primaryDark: "#5aa8ff",
    primaryDisabled: "#4c6f92",
    primaryLight: "#10243a",
    warningDark: "#ffbf66",
    warningDisabled: "#8a6a3a",
    warningLight: "#3d2f1b",
    successDark: "#7ad94b",
    successDisabled: "#5f7f4f",
    successLight: "#1f3316",
    errorDark: "#ff8a8a",
    errorDisabled: "#8d5858",
    errorLight: "#3a2222",
    infoDark: "#b0b3b8",
    infoDisabled: "#5f6368",
    infoLight: "#2f3238"
  });
  const DEFAULT_THEME_EXTRA_VARS = Object.freeze({
    light: Object.freeze({
      "--up-table2-header-bg-color": "#f5f7fa",
      "--up-table2-zebra-bg-color": "#fafafa",
      "--up-table2-highlight-bg-color": "#f5f7fa",
      "--up-gap-bg-color": "#f3f4f6",
      "--up-skeleton-bg-color": "#f1f2f4",
      "--up-skeleton-shimmer-color": "#e6e6e6",
      "--up-swipe-action-button-bg-color": "#c7c6cd",
      "--up-index-list-indicator-bg-color": "#c9c9c9",
      "--up-calendar-month-mark-color": "rgba(231, 232, 234, 0.83)",
      "--up-navbar-glass-bg-color": "rgba(255, 255, 255, 0.82)",
      "--up-navbar-glass-blur": "20px"
    }),
    dark: Object.freeze({
      "--up-table2-header-bg-color": "#2a2d33",
      "--up-table2-zebra-bg-color": "#23262b",
      "--up-table2-highlight-bg-color": "#2f3440",
      "--up-gap-bg-color": "#111111",
      "--up-skeleton-bg-color": "#2f3135",
      "--up-skeleton-shimmer-color": "rgba(255, 255, 255, 0.12)",
      "--up-swipe-action-button-bg-color": "#4b5563",
      "--up-index-list-indicator-bg-color": "#4b5563",
      "--up-calendar-month-mark-color": "rgba(255, 255, 255, 0.04)",
      "--up-navbar-glass-bg-color": "rgba(28, 28, 30, 0.82)",
      "--up-navbar-glass-blur": "20px"
    })
  });
  const themeState = {
    preference: "system",
    mode: "light",
    version: 0,
    vars: {}
  };
  const THEME_MODE_STORAGE_KEY = "u-theme-mode";
  const THEME_MODE_SYSTEM = "system";
  const THEME_MODE_MANUAL = ["light", "dark"];
  const LIGHT_THEME_TOKEN_FIELD_MAP = Object.freeze({
    "primary": "primary",
    "primary-dark": "primaryDark",
    "primary-disabled": "primaryDisabled",
    "primary-light": "primaryLight",
    "warning": "warning",
    "warning-dark": "warningDark",
    "warning-disabled": "warningDisabled",
    "warning-light": "warningLight",
    "success": "success",
    "success-dark": "successDark",
    "success-disabled": "successDisabled",
    "success-light": "successLight",
    "error": "error",
    "error-dark": "errorDark",
    "error-disabled": "errorDisabled",
    "error-light": "errorLight",
    "info": "info",
    "info-dark": "infoDark",
    "info-disabled": "infoDisabled",
    "info-light": "infoLight",
    "main-color": "mainColor",
    "content-color": "contentColor",
    "tips-color": "tipsColor",
    "light-color": "lightColor",
    "border-color": "borderColor",
    "bg-color": "bgColor",
    "disabled-color": "disabledColor"
  });
  const LIGHT_THEME_FIELD_TOKEN_MAP = Object.freeze(
    Object.fromEntries(
      Object.entries(LIGHT_THEME_TOKEN_FIELD_MAP).map(([token, field]) => [field, token])
    )
  );
  const runtimeThemeOverrideState = {
    color: /* @__PURE__ */ Object.create(null),
    configColor: /* @__PURE__ */ Object.create(null)
  };
  let cachedLightThemeColors = null;
  let hasRegisterThemeListener = false;
  let currentThemePreference = THEME_MODE_SYSTEM;
  function normalizeThemeMode(theme = "light") {
    return theme === "dark" ? "dark" : "light";
  }
  function normalizeThemePreference(mode = THEME_MODE_SYSTEM) {
    if (THEME_MODE_MANUAL.includes(mode))
      return mode;
    return THEME_MODE_SYSTEM;
  }
  function getLightBridgeVar(token, fallback) {
    return `var(--up-light-${token}, ${fallback})`;
  }
  function clearOverrideBucket(bucket) {
    Object.keys(bucket).forEach((key) => {
      delete bucket[key];
    });
  }
  function normalizeLightThemeToken(token = "") {
    if (typeof token !== "string")
      return "";
    if (token.indexOf("up-") === 0)
      return token.slice(3);
    if (token.indexOf("u-") === 0)
      return token.slice(2);
    return token;
  }
  function isLightThemeConfigColorKey(token = "") {
    return token.indexOf("up-") === 0 || token.indexOf("u-") === 0;
  }
  function syncThemeColorOverrideState({
    color: colorOverrides,
    configColor: configColorOverrides,
    reset = false
  } = {}) {
    if (reset) {
      clearOverrideBucket(runtimeThemeOverrideState.color);
      clearOverrideBucket(runtimeThemeOverrideState.configColor);
    }
    if (colorOverrides && typeof colorOverrides === "object") {
      Object.keys(LIGHT_THEME_FIELD_TOKEN_MAP).forEach((field) => {
        if (!Object.prototype.hasOwnProperty.call(colorOverrides, field))
          return;
        const value = colorOverrides[field];
        if (typeof value === "string" && value) {
          runtimeThemeOverrideState.color[field] = true;
          return;
        }
        delete runtimeThemeOverrideState.color[field];
      });
    }
    if (configColorOverrides && typeof configColorOverrides === "object") {
      Object.keys(configColorOverrides).forEach((key) => {
        const token = normalizeLightThemeToken(key);
        if (!Object.prototype.hasOwnProperty.call(LIGHT_THEME_TOKEN_FIELD_MAP, token))
          return;
        const value = configColorOverrides[key];
        if (typeof value === "string" && value) {
          const overrideKey = isLightThemeConfigColorKey(key) ? key : `up-${token}`;
          runtimeThemeOverrideState.configColor[overrideKey] = true;
          return;
        }
        delete runtimeThemeOverrideState.configColor[key];
        delete runtimeThemeOverrideState.configColor[`u-${token}`];
        delete runtimeThemeOverrideState.configColor[`up-${token}`];
      });
    }
  }
  function getExplicitRuntimeColorValue(token, runtimeColorMap = {}) {
    const field = LIGHT_THEME_TOKEN_FIELD_MAP[token];
    if (!field)
      return "";
    if (runtimeThemeOverrideState.color[field]) {
      const value = color$2[field];
      if (typeof value === "string" && value)
        return value;
    }
    const upKey = `up-${token}`;
    const uKey = `u-${token}`;
    if (!runtimeThemeOverrideState.configColor[upKey] && !runtimeThemeOverrideState.configColor[uKey])
      return "";
    const upValue = runtimeColorMap[upKey];
    const uValue = runtimeColorMap[uKey];
    if (runtimeThemeOverrideState.configColor[upKey] && typeof upValue === "string" && upValue)
      return upValue;
    if (runtimeThemeOverrideState.configColor[uKey] && typeof uValue === "string" && uValue)
      return uValue;
    return "";
  }
  function readThemePreferenceFromStorage() {
    try {
      if (typeof uni !== "undefined" && typeof uni.getStorageSync === "function") {
        const mode = uni.getStorageSync(THEME_MODE_STORAGE_KEY);
        return normalizeThemePreference(mode);
      }
    } catch (e) {
    }
    return THEME_MODE_SYSTEM;
  }
  function writeThemePreferenceToStorage(mode) {
    try {
      if (typeof uni !== "undefined" && typeof uni.setStorageSync === "function") {
        uni.setStorageSync(THEME_MODE_STORAGE_KEY, mode);
      }
    } catch (e) {
    }
  }
  function getSystemTheme() {
    let theme = "light";
    try {
      if (typeof uni !== "undefined" && typeof uni.getAppBaseInfo === "function") {
        const appBaseInfo = uni.getAppBaseInfo() || {};
        if (appBaseInfo.theme) {
          theme = appBaseInfo.theme;
        }
      }
      if (typeof uni !== "undefined" && typeof uni.getSystemInfoSync === "function") {
        const systemInfo = uni.getSystemInfoSync() || {};
        if (systemInfo.theme) {
          theme = systemInfo.theme;
        }
      }
    } catch (e) {
      theme = "light";
    }
    return normalizeThemeMode(theme);
  }
  function getCurrentLightThemeColors() {
    const runtimeColorMap = config.color || {};
    const lightThemeColors = {
      ...DEFAULT_LIGHT_THEME_COLORS
    };
    Object.keys(LIGHT_THEME_TOKEN_FIELD_MAP).forEach((token) => {
      const explicitValue = getExplicitRuntimeColorValue(token, runtimeColorMap);
      if (!explicitValue)
        return;
      lightThemeColors[LIGHT_THEME_TOKEN_FIELD_MAP[token]] = explicitValue;
    });
    return lightThemeColors;
  }
  function getThemeColorsByMode(mode) {
    if (!cachedLightThemeColors) {
      cachedLightThemeColors = getCurrentLightThemeColors();
    }
    const themeMode = normalizeThemeMode(mode);
    if (themeMode === "dark") {
      return {
        ...DEFAULT_DARK_THEME_COLORS,
        primary: cachedLightThemeColors.primary,
        info: cachedLightThemeColors.info,
        warning: cachedLightThemeColors.warning,
        error: cachedLightThemeColors.error,
        success: cachedLightThemeColors.success
      };
    }
    return {
      ...cachedLightThemeColors
    };
  }
  function buildConfigColorMap(themeColors) {
    return {
      "u-primary": themeColors.primary,
      "u-primary-dark": themeColors.primaryDark,
      "u-primary-disabled": themeColors.primaryDisabled,
      "u-primary-light": themeColors.primaryLight,
      "u-warning": themeColors.warning,
      "u-warning-dark": themeColors.warningDark,
      "u-warning-disabled": themeColors.warningDisabled,
      "u-warning-light": themeColors.warningLight,
      "u-success": themeColors.success,
      "u-success-dark": themeColors.successDark,
      "u-success-disabled": themeColors.successDisabled,
      "u-success-light": themeColors.successLight,
      "u-error": themeColors.error,
      "u-error-dark": themeColors.errorDark,
      "u-error-disabled": themeColors.errorDisabled,
      "u-error-light": themeColors.errorLight,
      "u-info": themeColors.info,
      "u-info-dark": themeColors.infoDark,
      "u-info-disabled": themeColors.infoDisabled,
      "u-info-light": themeColors.infoLight,
      "u-main-color": themeColors.mainColor,
      "u-content-color": themeColors.contentColor,
      "u-tips-color": themeColors.tipsColor,
      "u-light-color": themeColors.lightColor,
      "u-border-color": themeColors.borderColor,
      "u-bg-color": themeColors.bgColor,
      "u-disabled-color": themeColors.disabledColor,
      "up-primary": themeColors.primary,
      "up-primary-dark": themeColors.primaryDark,
      "up-primary-disabled": themeColors.primaryDisabled,
      "up-primary-light": themeColors.primaryLight,
      "up-warning": themeColors.warning,
      "up-warning-dark": themeColors.warningDark,
      "up-warning-disabled": themeColors.warningDisabled,
      "up-warning-light": themeColors.warningLight,
      "up-success": themeColors.success,
      "up-success-dark": themeColors.successDark,
      "up-success-disabled": themeColors.successDisabled,
      "up-success-light": themeColors.successLight,
      "up-error": themeColors.error,
      "up-error-dark": themeColors.errorDark,
      "up-error-disabled": themeColors.errorDisabled,
      "up-error-light": themeColors.errorLight,
      "up-info": themeColors.info,
      "up-info-dark": themeColors.infoDark,
      "up-info-disabled": themeColors.infoDisabled,
      "up-info-light": themeColors.infoLight,
      "up-main-color": themeColors.mainColor,
      "up-content-color": themeColors.contentColor,
      "up-tips-color": themeColors.tipsColor,
      "up-light-color": themeColors.lightColor,
      "up-border-color": themeColors.borderColor,
      "up-bg-color": themeColors.bgColor,
      "up-disabled-color": themeColors.disabledColor
    };
  }
  function buildAliasCssVars(vars = {}) {
    const aliasVars = {};
    Object.keys(vars).forEach((key) => {
      if (typeof key !== "string")
        return;
      if (key.indexOf("--up-") === 0) {
        aliasVars[key.replace("--up-", "--u-")] = vars[key];
        return;
      }
      if (key.indexOf("--u-") === 0) {
        aliasVars[key.replace("--u-", "--up-")] = vars[key];
      }
    });
    return aliasVars;
  }
  function buildThemeCssVars(themeColors, mode = "light") {
    const themeMode = normalizeThemeMode(mode);
    const isDark = themeMode === "dark";
    const useBridge = !isDark;
    const runtimeColorMap = config.color || {};
    const defaultExtraVars = DEFAULT_THEME_EXTRA_VARS[themeMode] || DEFAULT_THEME_EXTRA_VARS.light;
    const pageBgColor = themeColors.bgColor || (isDark ? "#1f1f1f" : "#f3f4f6");
    const hoverBgColor = runtimeColorMap["up-hover-bg-color"] || runtimeColorMap["u-hover-bg-color"] || (isDark ? "#343741" : "#e7ebf0");
    const navbarBgColor = runtimeColorMap["up-navbar-bg-color"] || runtimeColorMap["u-navbar-bg-color"] || (isDark ? "#1c1c1e" : "#ffffff");
    const resolveLightTokenValue = (token, fallback) => {
      if (!useBridge)
        return fallback;
      const explicitValue = getExplicitRuntimeColorValue(token, runtimeColorMap);
      return explicitValue || getLightBridgeVar(token, fallback);
    };
    const resolvedMainColor = resolveLightTokenValue("main-color", themeColors.mainColor);
    const resolvedContentColor = resolveLightTokenValue("content-color", themeColors.contentColor);
    const resolvedTipsColor = resolveLightTokenValue("tips-color", themeColors.tipsColor);
    const resolvedLightColor = resolveLightTokenValue("light-color", themeColors.lightColor);
    const resolvedBorderColor = resolveLightTokenValue("border-color", themeColors.borderColor);
    const resolvedBgColor = resolveLightTokenValue("bg-color", themeColors.bgColor);
    const resolvedDisabledColor = resolveLightTokenValue("disabled-color", themeColors.disabledColor);
    const resolvedPrimary = resolveLightTokenValue("primary", themeColors.primary);
    const resolvedPrimaryDark = resolveLightTokenValue("primary-dark", themeColors.primaryDark);
    const resolvedPrimaryDisabled = resolveLightTokenValue("primary-disabled", themeColors.primaryDisabled);
    const resolvedPrimaryLight = resolveLightTokenValue("primary-light", themeColors.primaryLight);
    const resolvedWarning = resolveLightTokenValue("warning", themeColors.warning);
    const resolvedWarningDark = resolveLightTokenValue("warning-dark", themeColors.warningDark);
    const resolvedWarningDisabled = resolveLightTokenValue("warning-disabled", themeColors.warningDisabled);
    const resolvedWarningLight = resolveLightTokenValue("warning-light", themeColors.warningLight);
    const resolvedSuccess = resolveLightTokenValue("success", themeColors.success);
    const resolvedSuccessDark = resolveLightTokenValue("success-dark", themeColors.successDark);
    const resolvedSuccessDisabled = resolveLightTokenValue("success-disabled", themeColors.successDisabled);
    const resolvedSuccessLight = resolveLightTokenValue("success-light", themeColors.successLight);
    const resolvedError = resolveLightTokenValue("error", themeColors.error);
    const resolvedErrorDark = resolveLightTokenValue("error-dark", themeColors.errorDark);
    const resolvedErrorDisabled = resolveLightTokenValue("error-disabled", themeColors.errorDisabled);
    const resolvedErrorLight = resolveLightTokenValue("error-light", themeColors.errorLight);
    const resolvedInfo = resolveLightTokenValue("info", themeColors.info);
    const resolvedInfoDark = resolveLightTokenValue("info-dark", themeColors.infoDark);
    const resolvedInfoDisabled = resolveLightTokenValue("info-disabled", themeColors.infoDisabled);
    const resolvedInfoLight = resolveLightTokenValue("info-light", themeColors.infoLight);
    const coreVars = {
      "--u-main-color": resolvedMainColor,
      "--u-content-color": resolvedContentColor,
      "--u-tips-color": resolvedTipsColor,
      "--u-light-color": resolvedLightColor,
      "--u-border-color": resolvedBorderColor,
      "--u-bg-color": resolvedBgColor,
      "--u-hover-bg-color": hoverBgColor,
      "--u-disabled-color": resolvedDisabledColor,
      "--u-primary": resolvedPrimary,
      "--u-primary-dark": resolvedPrimaryDark,
      "--u-primary-disabled": resolvedPrimaryDisabled,
      "--u-primary-light": resolvedPrimaryLight,
      "--u-warning": resolvedWarning,
      "--u-warning-dark": resolvedWarningDark,
      "--u-warning-disabled": resolvedWarningDisabled,
      "--u-warning-light": resolvedWarningLight,
      "--u-success": resolvedSuccess,
      "--u-success-dark": resolvedSuccessDark,
      "--u-success-disabled": resolvedSuccessDisabled,
      "--u-success-light": resolvedSuccessLight,
      "--u-error": resolvedError,
      "--u-error-dark": resolvedErrorDark,
      "--u-error-disabled": resolvedErrorDisabled,
      "--u-error-light": resolvedErrorLight,
      "--u-info": resolvedInfo,
      "--u-info-dark": resolvedInfoDark,
      "--u-info-disabled": resolvedInfoDisabled,
      "--u-info-light": resolvedInfoLight,
      "--up-main-color": resolvedMainColor,
      "--up-content-color": resolvedContentColor,
      "--up-tips-color": resolvedTipsColor,
      "--up-light-color": resolvedLightColor,
      "--up-border-color": resolvedBorderColor,
      "--up-bg-color": resolvedBgColor,
      "--up-hover-bg-color": hoverBgColor,
      "--up-disabled-color": resolvedDisabledColor,
      "--up-primary": resolvedPrimary,
      "--up-primary-dark": resolvedPrimaryDark,
      "--up-primary-disabled": resolvedPrimaryDisabled,
      "--up-primary-light": resolvedPrimaryLight,
      "--up-warning": resolvedWarning,
      "--up-warning-dark": resolvedWarningDark,
      "--up-warning-disabled": resolvedWarningDisabled,
      "--up-warning-light": resolvedWarningLight,
      "--up-success": resolvedSuccess,
      "--up-success-dark": resolvedSuccessDark,
      "--up-success-disabled": resolvedSuccessDisabled,
      "--up-success-light": resolvedSuccessLight,
      "--up-error": resolvedError,
      "--up-error-dark": resolvedErrorDark,
      "--up-error-disabled": resolvedErrorDisabled,
      "--up-error-light": resolvedErrorLight,
      "--up-info": resolvedInfo,
      "--up-info-dark": resolvedInfoDark,
      "--up-info-disabled": resolvedInfoDisabled,
      "--up-info-light": resolvedInfoLight,
      "--up-page-bg-color": pageBgColor,
      "--up-card-bg-color": isDark ? "#1c1c1e" : "#ffffff",
      "--up-navbar-bg-color": navbarBgColor
    };
    const extraVars = {};
    Object.keys(runtimeColorMap).forEach((key) => {
      if (typeof key !== "string")
        return;
      const isThemeToken = key.indexOf("up-") === 0 || key.indexOf("u-") === 0;
      if (!isThemeToken)
        return;
      const cssVarName = `--${key}`;
      if (Object.prototype.hasOwnProperty.call(coreVars, cssVarName))
        return;
      const value = runtimeColorMap[key];
      if (typeof value === "string" && value) {
        extraVars[cssVarName] = value;
      }
    });
    return {
      ...coreVars,
      ...defaultExtraVars,
      ...buildAliasCssVars(defaultExtraVars),
      ...extraVars,
      ...buildAliasCssVars(extraVars)
    };
  }
  function getThemeVars(mode) {
    if (mode) {
      return buildThemeCssVars(getThemeColorsByMode(mode), mode);
    }
    if (themeState.vars && Object.keys(themeState.vars).length > 0) {
      return { ...themeState.vars };
    }
    return buildThemeCssVars(getThemeColorsByMode(themeState.mode), themeState.mode);
  }
  function hasActiveRuntimePage() {
    try {
      if (typeof getCurrentPages === "function") {
        const pages2 = getCurrentPages();
        return Array.isArray(pages2) && pages2.length > 0;
      }
    } catch (e) {
    }
    return false;
  }
  function trySetNavigationBarColor(options) {
    if (typeof uni === "undefined" || typeof uni.setNavigationBarColor !== "function")
      return;
    if (!hasActiveRuntimePage())
      return;
    try {
      const result = uni.setNavigationBarColor(options);
      if (result && typeof result.catch === "function") {
        result.catch(() => {
        });
      }
    } catch (e) {
    }
  }
  function applyNativeThemeUI(mode, themeColors, themeVars = {}) {
    var _a, _b;
    if (typeof uni === "undefined")
      return;
    if (config.nativeThemeSync !== true)
      return;
    const isDark = normalizeThemeMode(mode) === "dark";
    const pageBg = (themeColors == null ? void 0 : themeColors.bgColor) || (isDark ? "#1f1f1f" : "#f3f4f6");
    const navBg = (themeVars == null ? void 0 : themeVars["--up-navbar-bg-color"]) || (themeVars == null ? void 0 : themeVars["--u-navbar-bg-color"]) || ((_a = config.color) == null ? void 0 : _a["up-navbar-bg-color"]) || ((_b = config.color) == null ? void 0 : _b["u-navbar-bg-color"]) || (isDark ? "#1c1c1e" : "#ffffff");
    trySetNavigationBarColor({
      frontColor: isDark ? "#ffffff" : "#000000",
      backgroundColor: navBg,
      animation: {
        duration: 0,
        timingFunc: "linear"
      }
    });
    if (typeof uni.setBackgroundColor === "function") {
      uni.setBackgroundColor({
        backgroundColor: pageBg,
        backgroundColorTop: pageBg,
        backgroundColorBottom: pageBg
      });
    }
    trySetTabBarStyle({
      color: isDark ? "#8e8e93" : "#909399",
      selectedColor: isDark ? "#f2f2f7" : "#303133",
      backgroundColor: isDark ? "#111111" : "#ffffff",
      borderStyle: isDark ? "white" : "black"
    });
  }
  function applyTheme(mode = "light") {
    const themeMode = normalizeThemeMode(mode);
    const themeColors = getThemeColorsByMode(themeMode);
    const themeVars = buildThemeCssVars(themeColors, themeMode);
    index.shallowMerge(color$2, {
      primary: themeColors.primary,
      primaryDark: themeColors.primaryDark,
      primaryDisabled: themeColors.primaryDisabled,
      primaryLight: themeColors.primaryLight,
      info: themeColors.info,
      infoDark: themeColors.infoDark,
      infoDisabled: themeColors.infoDisabled,
      infoLight: themeColors.infoLight,
      default: themeColors.info,
      warning: themeColors.warning,
      warningDark: themeColors.warningDark,
      warningDisabled: themeColors.warningDisabled,
      warningLight: themeColors.warningLight,
      error: themeColors.error,
      errorDark: themeColors.errorDark,
      errorDisabled: themeColors.errorDisabled,
      errorLight: themeColors.errorLight,
      success: themeColors.success,
      successDark: themeColors.successDark,
      successDisabled: themeColors.successDisabled,
      successLight: themeColors.successLight,
      mainColor: themeColors.mainColor,
      contentColor: themeColors.contentColor,
      tipsColor: themeColors.tipsColor,
      lightColor: themeColors.lightColor,
      borderColor: themeColors.borderColor,
      bgColor: themeColors.bgColor,
      disabledColor: themeColors.disabledColor
    });
    index.shallowMerge(config.color, buildConfigColorMap(themeColors));
    config.themeMode = themeMode;
    themeState.preference = currentThemePreference;
    themeState.mode = themeMode;
    themeState.vars = { ...themeVars };
    themeState.version = Number(themeState.version || 0) + 1;
    applyNativeThemeUI(themeMode, themeColors, themeVars);
    if (typeof uni !== "undefined" && uni.$u && uni.$u.theme) {
      uni.$u.theme.mode = themeState.mode;
      if (Object.prototype.hasOwnProperty.call(uni.$u.theme, "colors")) {
        delete uni.$u.theme.colors;
      }
      uni.$u.theme.vars = { ...themeState.vars };
      uni.$u.theme.version = themeState.version;
    }
    if (typeof uni !== "undefined" && typeof uni.$emit === "function") {
      uni.$emit("uThemeChange", {
        mode: themeState.mode,
        colors: { ...themeColors },
        version: themeState.version,
        vars: { ...themeState.vars }
      });
    }
    return themeState;
  }
  function setTheme(mode = "light") {
    currentThemePreference = normalizeThemeMode(mode);
    writeThemePreferenceToStorage(currentThemePreference);
    return applyTheme(currentThemePreference);
  }
  function setThemePreference(mode = THEME_MODE_SYSTEM) {
    currentThemePreference = normalizeThemePreference(mode);
    writeThemePreferenceToStorage(currentThemePreference);
    if (currentThemePreference === THEME_MODE_SYSTEM) {
      return applyTheme(getSystemTheme());
    }
    return applyTheme(currentThemePreference);
  }
  function getThemePreference() {
    return currentThemePreference;
  }
  function refreshThemeFromConfig() {
    cachedLightThemeColors = getCurrentLightThemeColors();
    if (themeState.version > 0) {
      applyTheme(themeState.mode);
    }
  }
  function initThemeSystem() {
    if (typeof uni === "undefined")
      return;
    if (!cachedLightThemeColors) {
      cachedLightThemeColors = getCurrentLightThemeColors();
    }
    currentThemePreference = readThemePreferenceFromStorage();
    if (currentThemePreference === THEME_MODE_SYSTEM) {
      applyTheme(getSystemTheme());
    } else {
      applyTheme(currentThemePreference);
    }
    if (!hasRegisterThemeListener && typeof uni.onThemeChange === "function") {
      uni.onThemeChange((res = {}) => {
        if (currentThemePreference === THEME_MODE_SYSTEM) {
          applyTheme(res.theme);
        }
      });
      hasRegisterThemeListener = true;
    }
  }
  applyUniApiShims();
  const rootToastState = {
    ref: null
  };
  const rootNotifyState = {
    ref: null
  };
  function normalizeRootToastOptions(options = {}) {
    const toastOptions = typeof options === "string" ? { message: options } : options && typeof options === "object" ? { ...options } : {};
    if (!toastOptions.message && toastOptions.title) {
      toastOptions.message = toastOptions.title;
    }
    return toastOptions;
  }
  function setRootToastRef(ref = null) {
    rootToastState.ref = ref || null;
  }
  function rootToast(options = {}) {
    const toastOptions = normalizeRootToastOptions(options);
    const toastRef = rootToastState.ref;
    if (toastRef && typeof toastRef.show === "function") {
      toastRef.show(toastOptions);
      return;
    }
    if (!toastOptions.message)
      return;
    if (typeof uni !== "undefined" && typeof uni.showToast === "function") {
      uni.showToast({
        title: toastOptions.message,
        icon: "none",
        duration: Number(toastOptions.duration) || 2e3
      });
    }
  }
  function normalizeRootNotifyOptions(options = {}) {
    const notifyOptions = typeof options === "string" ? { message: options } : options && typeof options === "object" ? { ...options } : {};
    if (!notifyOptions.message && notifyOptions.title) {
      notifyOptions.message = notifyOptions.title;
    }
    return notifyOptions;
  }
  function setRootNotifyRef(ref = null) {
    rootNotifyState.ref = ref || null;
  }
  function rootNotify(options = {}) {
    const notifyOptions = normalizeRootNotifyOptions(options);
    const notifyRef = rootNotifyState.ref;
    if (notifyRef && typeof notifyRef.show === "function") {
      notifyRef.show(notifyOptions);
      return;
    }
    if (!notifyOptions.message)
      return;
    if (typeof uni !== "undefined" && typeof uni.showToast === "function") {
      uni.showToast({
        title: notifyOptions.message,
        icon: "none",
        duration: Number(notifyOptions.duration) || 3e3
      });
    }
  }
  let themeType = ["primary", "success", "error", "warning", "info"];
  function setConfig(configs) {
    var _a, _b;
    const settings2 = configs || {};
    index.shallowMerge(config, settings2.config || {});
    setPropsConfig(settings2.props || {});
    index.shallowMerge(color$2, settings2.color || {});
    index.shallowMerge(zIndex, settings2.zIndex || {});
    syncThemeColorOverrideState({
      color: settings2.color,
      configColor: (_a = settings2 == null ? void 0 : settings2.config) == null ? void 0 : _a.color
    });
    const shouldRefreshTheme = !!settings2.color || !!((_b = settings2 == null ? void 0 : settings2.config) == null ? void 0 : _b.color) || themeState.version > 0;
    if (shouldRefreshTheme) {
      refreshThemeFromConfig();
    }
  }
  index.setConfig = setConfig;
  const $u = {
    route,
    date: index.timeFormat,
    // 另名date
    colorGradient: colorGradient$1.colorGradient,
    hexToRgb: colorGradient$1.hexToRgb,
    rgbToHex: colorGradient$1.rgbToHex,
    colorToRgba: colorGradient$1.colorToRgba,
    test,
    type: themeType,
    http: http$1,
    config,
    // uview-plus配置信息相关，比如版本号
    zIndex,
    debounce,
    throttle,
    calc,
    mixin,
    mpMixin,
    props: props$7,
    ...index,
    color: color$2,
    platform: platform$1,
    theme: themeState,
    setTheme,
    setThemePreference,
    getThemePreference,
    getSystemTheme,
    getThemeVars,
    getThemeTabBarStyle,
    applyNativeThemeUI: applyNativeThemeUI$1,
    rootToast,
    setRootToastRef,
    rootNotify,
    setRootNotifyRef
  };
  function defineGlobalThemeHelpers(Vue2) {
    var _a;
    const globalProperties = (_a = Vue2 == null ? void 0 : Vue2.config) == null ? void 0 : _a.globalProperties;
    if (!globalProperties)
      return;
    Object.defineProperty(globalProperties, "upThemeIsDark", {
      configurable: true,
      get() {
        return getThemeIsDark();
      }
    });
    Object.defineProperty(globalProperties, "upThemeVars", {
      configurable: true,
      get() {
        return getThemeVarsForStyle();
      }
    });
    Object.defineProperty(globalProperties, "upThemePageStyle", {
      configurable: true,
      get() {
        return getThemePageStyle();
      }
    });
    Object.defineProperty(globalProperties, "upThemeCardStyle", {
      configurable: true,
      get() {
        return getThemeCardStyle();
      }
    });
    globalProperties.upThemeVar = function(varName, fallbackColor) {
      return getThemeVar(varName, fallbackColor);
    };
    globalProperties.upApplyNativeThemeUI = function() {
      return applyNativeThemeUI$1();
    };
  }
  const install = (Vue2, upuiParams = "") => {
    if (upuiParams) {
      uni.upuiParams = upuiParams;
      let temp = upuiParams();
      if (temp.httpIns) {
        temp.httpIns(http$1);
      }
      if (temp.options) {
        setConfig(temp.options);
      }
    }
    uni.$u = $u;
    initThemeSystem();
    if (Vue2 && Vue2.config && Vue2.config.globalProperties) {
      Vue2.config.globalProperties.$u = $u;
      defineGlobalThemeHelpers(Vue2);
    }
    if (Vue2 && typeof Vue2.mixin === "function") {
      Vue2.mixin(mixin);
    }
  };
  const uviewPlus = {
    install
  };
  const _sfc_main = {
    onLaunch() {
      formatAppLog("log", "at App.vue:4", "[家灯] v1.1.0 · 只做协作，不做诊断");
    },
    onShow() {
    },
    onHide() {
    }
  };
  const App = /* @__PURE__ */ _export_sfc(_sfc_main, [["__file", "D:/workZone/APP/frontend/src/App.vue"]]);
  function createApp() {
    const app = vue.createVueApp(App);
    app.use(uviewPlus);
    return { app };
  }
  const { app: __app__, Vuex: __Vuex__, Pinia: __Pinia__ } = createApp();
  uni.Vuex = __Vuex__;
  uni.Pinia = __Pinia__;
  __app__.provide("__globalStyles", __uniConfig.styles);
  __app__._component.mpType = "app";
  __app__._component.render = () => {
  };
  __app__.mount("#app");
})(Vue);
