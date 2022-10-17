
export class logger {
    static info(title, ...args) {
        console.log(`${title || "" }  | `, ...args);
    }
  
    static debug(isDebug, ...args) {
        if (isDebug) {
            this.info("DEBUG | ", ...args);
        }
    }

    static error(title, ...args) {
        console.error(`${title || "" } | ERROR | `, ...args);
        ui.notifications.error(`${title || "" } | ERROR | ${args[0]}`);
    }

    static notify(...args) {
        ui.notifications.notify(`${args[0]}`);
    }
}
