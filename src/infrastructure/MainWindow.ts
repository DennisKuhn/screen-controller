import controller from './Configuration/Controller';

/** TEST */
import windowsIpc, { CHANNEL as windowsCHANNEL, Windows, IpcArgs as windowsIpcArgs } from './Windows.ipc';

class MainWindow {

    static start(): void {

        controller.log();

        document.querySelectorAll < HTMLInputElement >('input[type = "checkbox"]').forEach(
            (windowCheck: HTMLInputElement) => {
                windowCheck.addEventListener('change', () => {
                    const windowArgs: windowsIpcArgs = {
                        window: windowCheck.id as Windows,
                        command: windowCheck.checked ? 'show' : 'hide'
                    };
                    windowsIpc.send(windowsCHANNEL, windowArgs);
                }
                );
            });

    }


}

MainWindow.start();

export default MainWindow;
