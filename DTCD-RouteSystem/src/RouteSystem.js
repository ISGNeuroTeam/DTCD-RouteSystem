import {
  SystemPlugin,
  LogSystemAdapter,
  InteractionSystemAdapter,
  AppGUISystemAdapter,
} from './../../DTCD-SDK';

import { parse, inject } from 'regexparam';
import { version } from '../package.json';

import routes from './routes';

export class RouteSystem extends SystemPlugin {
  #guid;
  #logSystem;
  #interactionSystem;
  #appGUISystem;
  #routes = routes;
  currentRoute = {};
  #authSystem;

  /**
   * @constructor
   * @param {String} guid guid of system instance
   */
  constructor(guid) {
    super();
    this.#guid = guid;
    this.#logSystem = new LogSystemAdapter('0.5.0', this.#guid, 'RouteSystem');
    this.#interactionSystem = new InteractionSystemAdapter('0.4.0');
    this.#appGUISystem = new AppGUISystemAdapter('0.1.0');
    this.#authSystem = this.getSystem('AuthSystem', '0.1.0');

    this.#routes.forEach(route => {
      route.parser = parse(route.path);
    });
  }

  /**
   * Returns meta information about plugin for registration in application
   * @returns {Object} - meta-info
   */
  static getRegistrationMeta() {
    return {
      type: 'core',
      title: 'Система роутинга',
      name: 'RouteSystem',
      version,
      withDependencies: false,
      priority: 0.9,
    };
  }

  init() {
    this.navigate(window.location.pathname);

    window.onpopstate = async () => {
      const route = this.#getRoute(window.location.pathname);
      if (route) {
        this.currentRoute = route;
        const { data: guiConfig } = await this.#interactionSystem.GETRequest(
          `/dtcd_utils/v1/page/${route.name}`
        );
        if (guiConfig === 'error') return;
        this.#appGUISystem.applyPageConfig(guiConfig.content);
        return;
      }
    };
  }

  /**
   * Returns guid of AuthSystem instance
   * @returns {String} - guid
   */
  get guid() {
    return this.#guid;
  }

  get route() {
    return this.currentRoute;
  }

  getRouteTitle() {
    return this.currentRoute.title;
  }

  #getRoute(path) {
    return this.#routes.find(route => {
      let routePattern = parse(route.path);
      return routePattern.pattern.test(path);
    });
  }

  #exec(path, result) {
    let i = 0,
      out = {};
    let matches = result.pattern.exec(path);
    while (i < result.keys.length) {
      out[result.keys[i]] = matches[++i] || null;
    }
    return out;
  }

  #getPathParams(path) {
    const route = this.#getRoute(path);
    return this.#exec(path, route.parser);
  }

  async navigate(path, isRedirect, redirectData) {
    //TODO : Add redirect functionality to router
    if (path === '/') path = '/workspaces';

    const route = this.#getRoute(path);

    if (route) {
      if (route?.meta?.requiresAuth && !this.#authSystem.isLoggedIn) return this.navigate('/login');
      if (route === this.currentRoute
        && this.#deleteUniqueUrlParams(this.currentRoute.name)
        === new URLSearchParams(`?${path.split('?')[1]}`).toString()
      ) return;


      try {
        if (!isRedirect) {
        const { data: guiConfig } = await this.#interactionSystem.GETRequest(
          `/dtcd_utils/v1/page/${route.name}`
        );

        this.currentRoute = route;

        if (guiConfig === 'error') {
          this.#logSystem.error(`Page '${route.name} is not found!`);
          return;
        }

        const strUrlParams = this.#deleteUniqueUrlParams(route.name);

          window.history.pushState(
            this.#getPathParams(path),
            path,
            window.location.origin + path + (strUrlParams ? '?' + strUrlParams : '')
          );
          this.#appGUISystem.applyPageConfig(guiConfig.content);
        } else {
          window.history.replaceState(
            redirectData,
            '',
            path
          );
        }


        return;
      } catch (eror) {
        this.#appGUISystem.instance.goTo404();
      }
    }
    this.#appGUISystem.instance.goTo404();
  }

  #deleteUniqueUrlParams(nameTargetRoute) {
    const urlParams = new URLSearchParams(window.location.search);

    for (let param of urlParams) {
      const paramKey = param[0];

      this.#routes.forEach(route => {
        if (route.name == nameTargetRoute) return;

        if (route.uniqueUrlParams?.indexOf(paramKey) >= 0) {
          urlParams.delete(paramKey);
        }
      });
    }

    return urlParams.toString();
  }
}
