(function () {
  let cleanupHistoryListener: () => void;
  let targetNode: Element | null = null;
  let _instance: any;
  let oldBalance: number = -1;
  let timeoutTimer: string | number | NodeJS.Timeout | null | undefined = null;

  const intervalIds: any[] = [];
  const config: MutationObserverInit = {
    attributes: false,
    childList: true,
    subtree: true
  };

  const findReactProp = (node: any, prop: string): any => {
    if (node.stateNode && node.stateNode.props && node.stateNode.props[prop]) {
      return node.stateNode.props[prop];
    } else if (node.child) {
      let child = node.child;
      while (child) {
        let value = findReactProp(child, prop);
        if (value !== null)
          return value;

        child = child.sibling;
      }
    }
    return null;
  };

  const mutationCallback = (mutations: MutationRecord[], _observer: MutationObserver) => {
    for (let _mutation of mutations)
      formatPoints();
  };

  const formatPoints = (firstTime: boolean = false): void => {
    if (targetNode !== null && targetNode.firstChild && targetNode.firstChild.firstChild && oldBalance >= 0)
      targetNode.firstChild.firstChild.nodeValue = new Intl.NumberFormat().format(oldBalance);

    if (timeoutTimer)
      clearTimeout(timeoutTimer);

    timeoutTimer = setTimeout(() => {
      if (targetNode !== null && targetNode.firstChild && targetNode.firstChild.firstChild) {
        const balance = parseInt(findReactProp(_instance, 'balance'), 10);
        if (balance !== null && !isNaN(balance) && oldBalance !== balance) {
          if (firstTime) {
            oldBalance = balance;
            targetNode.firstChild.firstChild.nodeValue = new Intl.NumberFormat().format(balance);
            return;
          }

          const diff = Math.abs(balance - oldBalance);
          const multipllier = balance > oldBalance ? 1 : -1;

          let fps = 1000 / 60,
            duration = 1000,
            increment = Math.floor((diff / duration) * fps),
            currVal = 0,
            update: string | number | NodeJS.Timeout | null | undefined = null;

          if (increment < 1) {
            increment = 1;
            fps = 1000 / diff;
          }
          console.info(increment, fps, oldBalance, balance);

          //Setup the interval
          update = setInterval(() => {
            if (currVal < diff) {
              currVal += increment;
              oldBalance += (increment * multipllier);
            } else {
              oldBalance = balance;
              if (update)
                clearInterval(update);
            }

            if (targetNode !== null && targetNode.firstChild && targetNode.firstChild.firstChild)
              targetNode.firstChild.firstChild.nodeValue = new Intl.NumberFormat().format(oldBalance);
          }, fps);
        }
      }
    }, 100);
  };
  const findPointsContainer = (): void => {
    const timer = setInterval(function () {
      targetNode = document.querySelector('div[data-test-selector="balance-string"]');
      if (targetNode !== null) {
        formatPoints(true);

        // Observe for updated channel points
        observer.observe(targetNode, config);
        clearInterval(timer);
      }
    }, 1000);
    intervalIds.push(timer);
  };

  // Watch for navigation changes within the React app
  const navigationHook = (history: any): void => {
    let lastPathName = history.location.pathname;
    cleanupHistoryListener = history.listen((location: any) => {
      if (location.pathname !== lastPathName) {
        lastPathName = location.pathname;
        cleanup();
        start();
      }
    });
  };

  // Find the react instance of a element
  const findReact = (element: string, target: string): Promise<any> => {
    let defferedResolve: (value: any) => void;
    const prom = new Promise<any>((resolve, _) => {
      defferedResolve = resolve;
    });

    const timer = setInterval(() => {
      const reactRoot = document.getElementById(element);
      if (reactRoot !== null) {
        let reactInstance = null;
        for (let key of Object.keys(reactRoot)) {
          if (key.startsWith(target)) {
            reactInstance = reactRoot[key as keyof HTMLElement];
            break;
          }
        }
        if (reactInstance) {
          defferedResolve(reactInstance);
          clearInterval(timer);
        }
      }
    }, 500);

    intervalIds.push(timer);
    return prom;
  };

  const hookIntoReact = async () => {
    // Find the root instance 
    console.log('Finding react');
    const instance = await findReact('root', '__reactContainer');
    if (instance) {
      _instance = instance;

      // Hook into router
      const history = findReactProp(instance, 'history');
      if (history)
        navigationHook(history);

      // Determine if the channel has points enabled (May take some time to load)
      const timer = setInterval(() => {
        const enabled = findReactProp(instance, 'isChannelPointsEnabled');
        if (enabled)
          findPointsContainer();

        if (enabled !== null)
          clearInterval(timer);
      }, 1000);
      intervalIds.push(timer);
    }
  };

  const start = () => {
    window.removeEventListener('beforeunload', cleanup);
    window.addEventListener('beforeunload', cleanup);
    hookIntoReact();
  }

  const cleanup = () => {
    observer.disconnect();
    for (const id of intervalIds)
      clearInterval(id);

    if (cleanupHistoryListener)
      cleanupHistoryListener();
  }

  const observer = new MutationObserver(mutationCallback);
  start();
})();