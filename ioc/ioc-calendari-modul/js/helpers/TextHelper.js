/**
 * =================================================================
 * TEXT HELPER - UTILITATS DE TEXT PER CALENDARI IOC
 * =================================================================
 * 
 * @file        TextHelper.js
 * @description Classe d'utilitats per manipulació i formatatge de text
 * @author      Ismael Trascastro <itrascastro@ioc.cat>
 * @version     1.0.0
 * @date        2025-01-17
 * @project     Calendari Mòdul IOC
 * @repository  https://github.com/itrascastro/ioc-modul-calendari
 * @license     MIT
 * 
 * Aquest fitxer forma part del projecte Calendari Mòdul IOC,
 * una aplicació web per gestionar calendaris acadèmics.
 * 
 * =================================================================
 */

// Classe d'utilitats de text completament independent
class TextHelper {
    
    // Truncar text si supera la longitud màxima
    truncateText(text, maxLength = 30) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    }
}

// === INSTÀNCIA GLOBAL ===
const textHelper = new TextHelper();