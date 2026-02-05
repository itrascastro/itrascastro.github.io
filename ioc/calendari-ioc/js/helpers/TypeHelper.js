/**
 * =================================================================
 * TYPE HELPER - NORMALITZACIÓ DE TIPUS DE CALENDARI
 * =================================================================
 *
 * @file        TypeHelper.js
 * @description Utilitat per normalitzar el tipus de calendari
 * @author      Ismael Trascastro <itrascastro@ioc.cat>
 * @version     1.0.0
 * @date        2025-01-16
 * @project     Calendari IOC
 * @repository  https://github.com/itrascastro/calendari-ioc
 * @license     MIT
 *
 * =================================================================
 */

class TypeHelper {
    normalizeCalendarType(type) {
        return (type || 'ALTRE').toString().toUpperCase();
    }
}

const typeHelper = new TypeHelper();
