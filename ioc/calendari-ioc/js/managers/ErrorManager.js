class ErrorManager {
    
    handleError(error) {
        if (error instanceof CalendariIOCException) {
            if (error.logToConsole) {
                console.error(`[${error.context}] ${error.missatge}`);
            }
            uiHelper.showMessage(error.missatge, 'error');
        } else {
            console.error('[UNHANDLED ERROR]', error);
            uiHelper.showMessage('Ha ocorregut un error inesperat.', 'error');
        }
    }
}

const errorManager = new ErrorManager();