/**
 * =================================================================
 * COLOR CONTRAST HELPER - UTILITATS PER CONTRAST DE TEXT
 * =================================================================
 * 
 * @file        ColorContrastHelper.js
 * @description Helper per calcular colors de text amb contrast òptim segons el fons
 * @author      Ismael Trascastro <itrascastro@ioc.cat>
 * @version     1.0.0
 * @date        2025-01-24
 * @project     Calendari Mòdul IOC
 * @repository  https://github.com/itrascastro/ioc-modul-calendari
 * @license     MIT
 * 
 * Aquest fitxer forma part del projecte Calendari Mòdul IOC,
 * una aplicació web per gestionar calendaris acadèmics.
 * 
 * =================================================================
 */

// Classe helper per gestionar contrast de colors
class ColorContrastHelper {
    
    // === CONTRAST DE TEXT ===
    
    // Obtenir color de text amb contrast òptim per a un fons donat
    getContrastColor(backgroundColor) {
        if (!backgroundColor || backgroundColor === 'transparent') {
            return 'var(--main-text-color)';
        }
        
        return this.isColorDark(backgroundColor) ? '#ffffff' : '#000000';
    }
    
    // === DETECCIÓ DE COLORS FOSCOS ===
    
    // Determinar si un color és fosc o clar basant-se en la seva lluminositat
    isColorDark(color) {
        // Convertir color hex a RGB
        let r, g, b;
        
        if (color.charAt(0) === '#') {
            const hex = color.substring(1);
            if (hex.length === 3) {
                r = parseInt(hex.charAt(0) + hex.charAt(0), 16);
                g = parseInt(hex.charAt(1) + hex.charAt(1), 16);
                b = parseInt(hex.charAt(2) + hex.charAt(2), 16);
            } else if (hex.length === 6) {
                r = parseInt(hex.substring(0, 2), 16);
                g = parseInt(hex.substring(2, 4), 16);
                b = parseInt(hex.substring(4, 6), 16);
            }
        } else if (color.startsWith('rgb')) {
            const rgb = color.match(/\d+/g);
            r = parseInt(rgb[0]);
            g = parseInt(rgb[1]);
            b = parseInt(rgb[2]);
        } else {
            // Per a noms de colors coneguts o altres formats, usar heurística
            const darkColorNames = ['black', 'darkred', 'darkgreen', 'darkblue', 'brown', 'maroon'];
            return darkColorNames.some(darkName => color.toLowerCase().includes(darkName));
        }
        
        // Calcular lluminositat relativa segons estàndard W3C
        // Formula: (0.299 * R + 0.587 * G + 0.114 * B) / 255
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        // Si la lluminositat és menor que 0.5, es considera fosc
        return luminance < 0.5;
    }
    
    // === APLICACIÓ D'ESTILS ===
    
    // Generar estil complet amb background i color de text contrastant
    getContrastStyle(backgroundColor) {
        const textColor = this.getContrastColor(backgroundColor);
        return `background-color: ${backgroundColor}; color: ${textColor};`;
    }
}

// === INSTÀNCIA GLOBAL ===
const colorContrastHelper = new ColorContrastHelper();