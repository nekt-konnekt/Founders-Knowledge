!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;void 0!==a?u=e[a]=[]:a="posthog";u.people=u.people||[];u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e};u.people.toString=function(){return u.toString(1)+".people (stub)"};o="init capture register register_once unregister identify alias people.set people.set_once people.unset people.increment people.append people.remove people.group reset get_distinct_id getGroups setPersonProperties setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags group identify group identify".split(" ");for(n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
window.posthog.init('phc_uGYFs8Y9nHjriPiauSgcHJHDrUsGBvHs85mFKdKwTUyj', {
  api_host: 'https://us.i.posthog.com',
  autocapture: false,
  capture_pageview: true,
  capture_pageleave: true,
  person_profiles: 'identified_only'
});
(function () {
  function track(name, properties) {
    if (window.posthog && typeof window.posthog.capture === 'function') {
      window.posthog.capture(name, properties);
    }
  }
  document.addEventListener('click', function (event) {
    var target = event.target && event.target.closest ? event.target.closest('a, button') : null;
    if (!target) return;

    var channels = [
      ['data-share-whatsapp', 'whatsapp'],
      ['data-share-linkedin', 'linkedin'],
      ['data-share-x', 'x'],
      ['data-share-native', 'native']
    ];
    for (var i = 0; i < channels.length; i++) {
      if (target.hasAttribute(channels[i][0])) {
        track('knowledge_share_clicked', {
          channel: channels[i][1],
          page_path: window.location.pathname,
          page_title: document.title
        });
        return;
      }
    }

    if (target.hasAttribute('data-copy-share')) {
      track('knowledge_link_copied', {
        page_path: window.location.pathname,
        page_title: document.title
      });
      return;
    }

    if (target.tagName === 'A' && target.href) {
      try {
        var destination = new URL(target.href, window.location.href);
        if (destination.origin === window.location.origin &&
            destination.pathname.indexOf('/lessons/') === 0 &&
            destination.pathname !== window.location.pathname) {
          track('lesson_navigation_clicked', {
            source_path: window.location.pathname,
            destination_path: destination.pathname,
            link_text: (target.innerText || target.textContent || '').trim().slice(0, 80)
          });
        }
      } catch (_) {}
    }
  });
})();
