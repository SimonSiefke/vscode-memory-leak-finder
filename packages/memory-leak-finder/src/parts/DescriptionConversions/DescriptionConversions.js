import * as DescriptionString from '../DescriptionString/DescriptionString.js'

export const descriptionConversions = [
  {
    from: 'function Xt(e,t,n,r){Yt(Kt,$t.bind(null,e,t,n,r))}',
    to: DescriptionString.ReactInternalFunction,
  },
  {
    from: 'function(){n&&"function"==typeof n&&n.apply(this,arguments);var r=Array.prototype.slice.call(arguments);try{var o=r.map((function(e){return p(e,t)}));return e.handleEvent?e.handleEvent.apply(this,o):e.apply(this,o)}catch(a){throw h(),Object(s.l)((function(e){e.addEventProcessor((function(e){var n=i.a({},e);return t.mechanism&&(Object(u.b)(n,void 0,void 0),Object(u.a)(n,t.mechanism)),n.extra=i.a({},n.extra,{arguments:Object(c.c)(r,3)}),n})),Object(s.c)(a)})),a}}',
    to: DescriptionString.SentryInternalFunction,
  },
  {
    from: 'function t(){var t=[],r=arguments.length,o=!e||e&&!1!==e.deep;a&&c(a)&&a.apply(this,arguments);for(;r--;)t[r]=o?n.wrap(e,arguments[r]):arguments[r];try{return i.apply(this,t)}catch(i){n._ignoreNextOnError();n.captureException(i,e);throw i}}',
    to: DescriptionString.SentryInternalFunction,
  },
  {
    from: 'function(){var s=Array.prototype.slice.call(arguments);try{o&&"function"==typeof o&&o.apply(this,arguments);var u=s.map((function(r){return wrap(r,n)}));return r.apply(this,u)}catch(r){throw ignoreNextOnError(),(0,a.$e)((function(o){o.addEventProcessor((function(r){return n.mechanism&&((0,l.Db)(r,void 0,void 0),(0,l.EG)(r,n.mechanism)),r.extra=(0,i.pi)((0,i.pi)({},r.extra),{arguments:s}),r})),(0,a.Tb)(r)})),r}}',
    to: DescriptionString.SentryInternalFunction,
  },
  {
    from: 'function(){var i=Array.prototype.slice.call(arguments);try{n&&"function"===typeof n&&n.apply(this,arguments);var a=i.map((function(e){return v(e,t)}));return e.apply(this,a)}catch(s){throw p(),(0,o.$e)((function(e){e.addEventProcessor((function(e){return t.mechanism&&((0,l.Db)(e,void 0,void 0),(0,l.EG)(e,t.mechanism)),e.extra=(0,r.pi)((0,r.pi)({},e.extra),{arguments:i}),e})),(0,o.Tb)(s)})),s}}',
    to: DescriptionString.SentryInternalFunction,
  },
  {
    from: 'function(){var i=Array.prototype.slice.call(arguments);try{n&&"function"==typeof n&&n.apply(this,arguments);var u=i.map((function(e){return f(e,t)}));return e.handleEvent?e.handleEvent.apply(this,u):e.apply(this,u)}catch(e){throw c(),(0,o.$e)((function(n){n.addEventProcessor((function(e){var n=(0,r.pi)({},e);return t.mechanism&&((0,a.Db)(n,void 0,void 0),(0,a.EG)(n,t.mechanism)),n.extra=(0,r.pi)((0,r.pi)({},n.extra),{arguments:i}),n})),(0,o.Tb)(e)})),e}}',
    to: DescriptionString.SentryInternalFunction,
  },
  {
    from: 'function(){u||(u=!0,a.observe(h,{subtree:!0,attributes:!0,attributeFilter:Object.keys(d)}))}',
    to: DescriptionString.LazySizesInternalFunction,
  },
  {
    from: 'handleEvent(a){if("function"===typeof this.Da){let b,c;this.Da.call(null!=(c=null==(b=this.options)?void 0:b.host)?\nc:this.element,a)}else this.Da.handleEvent(a)}',
    to: DescriptionString.PolymerInternalFunction,
  },
  {
    from: '(e) => {\n    if (!e._vts) {\n      e._vts = Date.now();\n    } else if (e._vts <= invoker.attached) {\n      return;\n    }\n    callWithAsyncErrorHandling(\n      patchStopImmediatePropagation(e, invoker.value),\n      instance,\n      5,\n      [e]\n    );\n  }',
    to: DescriptionString.VueInternalFunction,
  },
]
