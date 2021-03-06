// @flow

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
/* global window */

/**
 * Redux store utils
 * @module utils/create-store
 */

import { createStore, applyMiddleware } from "redux";
import { waitUntilService } from "./redux/middleware/wait-service";
import { log } from "./redux/middleware/log";
import { history } from "./redux/middleware/history";
import { promise } from "./redux/middleware/promise";
import { thunk } from "./redux/middleware/thunk";

/**
 * @memberof utils/create-store
 * @static
 */
type ReduxStoreOptions = {
  makeThunkArgs?: Function,
  history?: Array<Object>,
  middleware?: Function[],
  log?: boolean
};

/**
 * This creates a dispatcher with all the standard middleware in place
 * that all code requires. It can also be optionally configured in
 * various ways, such as logging and recording.
 *
 * @param {object} opts:
 *        - log: log all dispatched actions to console
 *        - history: an array to store every action in. Should only be
 *                   used in tests.
 *        - middleware: array of middleware to be included in the redux store
 * @memberof utils/create-store
 * @static
 */
const configureStore = (opts: ReduxStoreOptions = {}) => {
  const middleware = [
    thunk(opts.makeThunkArgs),
    promise,

    // Order is important: services must go last as they always
    // operate on "already transformed" actions. Actions going through
    // them shouldn't have any special fields like promises, they
    // should just be normal JSON objects.
    waitUntilService
  ];

  if (opts.history) {
    middleware.push(history(opts.history));
  }

  if (opts.middleware) {
    opts.middleware.forEach(fn => middleware.push(fn));
  }

  if (opts.log) {
    middleware.push(log);
  }

  // Hook in the redux devtools browser extension if it exists
  const devtoolsExt = typeof window === "object" && window.devToolsExtension
    ? window.devToolsExtension()
    : f => f;

  return applyMiddleware(...middleware)(devtoolsExt(createStore));
};

export default configureStore;
