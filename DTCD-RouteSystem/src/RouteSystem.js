import { SystemPlugin, LogSystemAdapter, InteractionSystemAdapter, AppGUISystemAdapter } from './../../DTCD-SDK';

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
      priority: 0.5,
    };
  }

  init() {
    const { pathname, search, hash } = location;
    this.navigate(pathname + search + hash);

    window.onpopstate = async () => {
      const route = this.#getRoute(location.pathname);
      if (route) {
        this.currentRoute = route;
        const { data: guiConfig } = await this.#interactionSystem.GETRequest(`/dtcd_utils/v1/page/${route.name}`);
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
      let pathPattern = parse(route.path);
      let aliasPattern = parse(route.alias || route.path);
      return pathPattern.pattern.test(path) || aliasPattern.pattern.test(path);
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

  #parsePath(path) {
    let hash = '';
    let query = '';

    const hashIndex = path.indexOf('#');
    if (hashIndex >= 0) {
      hash = path.slice(hashIndex);
      path = path.slice(0, hashIndex);
    }

    const queryIndex = path.indexOf('?');
    if (queryIndex >= 0) {
      query = path.slice(queryIndex + 1);
      path = path.slice(0, queryIndex);
    }

    return {
      path,
      query,
      hash,
    };
  }

  async navigate(path, replace) {
    const parsedPath = this.#parsePath(path || '');
    const route = this.#getRoute(parsedPath.path);

    if (route) {
      await this.#logSystem.uploadLogs();

      try {
        if (replace) {
          history.replaceState(this.#getPathParams(parsedPath.path), '', path);
        } else {
          const { data: guiConfig } = await this.#interactionSystem.GETRequest(`/dtcd_utils/v1/page/${route.name}`);

          if (guiConfig === 'error') {
            this.#logSystem.error(`Page '${route.name} is not found!`);
            return;
          }

          history.pushState(this.#getPathParams(parsedPath.path), '', path);

          this.#appGUISystem.applyPageConfig(guiConfig.content);
        }
        this.currentRoute = route;
        return;
      } catch (error) {
        this.#appGUISystem.instance.goTo404();
      }
    }
    this.#appGUISystem.instance.goTo404();
  }

  replace(path) {
    this.navigate(path, true);
  }
}
