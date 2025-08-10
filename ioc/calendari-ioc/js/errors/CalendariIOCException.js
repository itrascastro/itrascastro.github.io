/**
 * =================================================================
 * CALENDARI IOC EXCEPTION - SISTEMA CENTRALITZAT D'ERRORS
 * =================================================================
 * 
 * @file        CalendariIOCException.js
 * @description Sistema d'excepció única per tota l'aplicació amb codis numèrics
 * @author      Ismael Trascastro <itrascastro@ioc.cat>
 * @version     1.0.0
 * @date        2025-07-28
 * @project     Calendari Mòdul IOC
 * @repository  https://github.com/itrascastro/ioc-modul-calendari
 * @license     MIT
 * 
 * Aquest fitxer implementa el patró Exception Translation per convertir
 * errors JavaScript nadius i de validació a una excepció del domini.
 * 
 * =================================================================
 */

/**
 * Excepció centralitzada per tota l'aplicació Calendari IOC
 * Implementa el patró Exception Translation amb sistema de codis numèrics
 * 
 * @class CalendariIOCException
 * @extends Error
 */
class CalendariIOCException extends Error {
    /**
     * Constructor de l'excepció del domini
     * 
     * @param {string} codiCausa - Codi numèric de l'error (1xx, 2xx, 3xx, etc.)
     * @param {string} context - Context d'on prové l'error per debugging
     * @param {boolean} logToConsole - Si l'error s'ha de mostrar a la consola (defecte: true)
     */
    constructor(codiCausa, context = '', logToConsole = true) {
        super();
        this.name = 'CalendariIOCException';
        this.codiCausa = codiCausa;
        this.context = context;
        this.logToConsole = logToConsole;
        this.timestamp = new Date();
        this.missatge = this.getMissatgePerCodi(codiCausa);
    }
    
    /**
     * Mapa centralitzat dels missatges d'error de l'aplicació
     * Versió inicial amb només els codis utilitzats en StorageManager
     * Es van afegint més codis a mesura que es migren altres classes
     * 
     * @param {string} codi - Codi numèric de l'error
     * @returns {string} Missatge d'error localitzat
     */
    getMissatgePerCodi(codi) {
        const missatges = {
            // === ERRORS DE CONFIGURACIÓ (1xx) ===
            // Problemes de càrrega inicial de configuració
            "108": "Error carregant configuració de semestre",
            "109": "Error carregant fitxer de configuració",
            "110": "Error parsejant fitxer de configuració",
            
            // === ERRORS DE REPLICACIÓ (2xx) ===
            // Problemes tècnics durant la replicació
            "207": "Error durant la replicació",
            
            // === ERRORS DE SISTEMA (3xx) ===
            // localStorage, quota, inicialització
            "301": "localStorage no disponible",
            "302": "Quota de localStorage exhaurida", 
            "303": "Dades corruptes al localStorage",
            "304": "Error exportant estat",
            
            // === ERRORS DE GESTIÓ DE CALENDARIS (4xx) ===
            // Problemes de validació i operacions amb calendaris
            "401": "Selecciona un tipus de calendari",
            "402": "Ja existeix un calendari amb aquest nom",
            "403": "Error creant el calendari",
            "404": "Error tècnic durant la creació del calendari",
            "405": "Els camps Cicle i Mòdul són obligatoris",
            "406": "Tots els camps són obligatoris per tipus Altre",
            "407": "La data de fi ha de ser posterior a la data d'inici",
            "408": "Calendari destí per importació ICS no trobat",
            "409": "La importació ICS només està disponible per calendaris tipus \"Altre\"",
            "410": "Error processant els esdeveniments ICS importats",
            "411": "Estructura del fitxer de calendari incorrecta",
            "412": "Ja existeix un calendari amb aquest identificador",
            "413": "Els calendaris d'estudi requereixen codi de semestre",
            "414": "Error carregant el fitxer de calendari",
            "415": "Fitxer JSON incompatible amb aquesta versió de l'aplicació. Exporta un nou JSON amb la versió actual",
            "416": "localStorage conté dades d'una versió anterior. Utilitzeu 'Clear Storage' (part superior dreta) per netejar-les i reiniciar.",
            
            // === ERRORS DE VALIDACIÓ DE DATES (5xx) ===
            // Validació de dates i rangs temporals
            "501": "Data no vàlida",
            "502": "No hi ha calendari actiu",
            "503": "Data fora del rang del calendari",
            "504": "La data ha d'estar dins del període del calendari",
            "505": "La data ha de ser un dia laborable",
            
            // === ERRORS DE VALIDACIÓ DE DADES (6xx) ===
            // Format i validació de dades d'entrada
            "601": "El títol de l'event és obligatori",
            "602": "Has de seleccionar una data per a l'event",
            "603": "Has de seleccionar una categoria de la llista",
            "604": "La data de l'event ha d'estar dins del període del calendari actiu",
            "605": "No es poden moure els events del sistema IOC",
            "606": "Per crear un esdeveniment és necessari que existeixi almenys una categoria que no sigui de sistema",
            "609": "Format de dades no vàlid",
            
            // === ERRORS DE REPLICACIÓ I GESTIÓ (7xx) ===
            // Errors específics de replicació de calendaris
            "701": "Calendari origen no trobat",
            "702": "No s'ha seleccionat calendari origen",
            "703": "Selecciona un calendari destí",
            "704": "Error accedint als calendaris",
            "705": "Error durant la replicació",
            "706": "Error tècnic en el procés de replicació",
            
            // === ERRORS DE GESTIÓ DE CATEGORIES (8xx) ===
            // Errors específics de categories d'esdeveniments
            "801": "Ja existeix una categoria amb aquest nom al catàleg",
            "802": "El nom de la categoria no pot estar buit",
            
            // === ERRORS D'IMPORTACIÓ ICS (9xx) ===
            // Errors específics d'importació de fitxers ICS
            "901": "Error llegint el fitxer ICS",
            "902": "No s'han trobat esdeveniments vàlids al fitxer ICS",
            "903": "Format de data invàlid al fitxer ICS",
            
            // === ERRORS DE CONFIGURACIÓ DE SISTEMA (10xx) ===
            // Errors específics de configuració i inicialització
            "1001": "SemesterConfig requereix un calendarType",
            "1002": "SemesterConfig no està inicialitzat",
            
            // === ERRORS D'EXPORTACIÓ (11xx) ===
            // Errors específics d'exportació de calendaris
            "1101": "Calendari no trobat per exportació HTML",
            "1102": "Calendari no trobat per exportació JSON",
            
            // === ERRORS DE FACTORY I SERVEIS (12xx) ===
            // Errors específics de factories i serveis
            "1201": "Calendaris no proporcionats al factory de replicació",
            
            // === ERRORS DE MODELS DE DADES (13xx) ===
            // Errors específics de les classes de model (v2.0)
            "1301": "Category requereix id, name i color",
            "1302": "Event requereix id, title i date",
            "1303": "Category ha de ser una instància de la classe Category",
            "1304": "Calendar requereix id, name, startDate, endDate i type",
            "1305": "addCategory requereix una instància de Category",
            "1306": "addEvent requereix una instància d'Event",
            "1307": "Error en la rehidratació de dades",
            
            // === ERRORS D'INICIALITZACIÓ BOOTSTRAP (14xx) ===
            // Errors específics d'inicialització de l'aplicació
            "1401": "Error durant la inicialització de l'aplicació",
            
            // === 999: ERRORS NO CONTROLATS ===
            "999": "Error no controlat del sistema"
        };
        
        return missatges[codi] || "Error desconegut";
    }
    
    /**
     * Genera missatge formatat per logging amb context i timestamp
     * 
     * @returns {string} Missatge complet per consola
     */
    getMessage() {
        const contextStr = this.context ? ` [${this.context}]` : '';
        const timeStr = this.timestamp.toISOString();
        return `Error ${this.codiCausa}${contextStr} (${timeStr}): ${this.missatge}`;
    }
    
    // === MÈTODES DE CLASSIFICACIÓ ===
    // Permeten al Bootstrap classificar el tipus d'error per respondre adequadament
    
    /**
     * @returns {boolean} True si és error de validació d'usuari
     */
    isValidationError() { 
        return this.codiCausa.startsWith('1'); 
    }
    
    /**
     * @returns {boolean} True si és error tècnic 
     */
    isTechnicalError() { 
        return this.codiCausa.startsWith('2'); 
    }
    
    /**
     * @returns {boolean} True si és error de sistema
     */
    isSystemError() { 
        return this.codiCausa.startsWith('3'); 
    }
    
    /**
     * @returns {boolean} True si és error de domini/negoci
     */
    isDomainError() { 
        return this.codiCausa.startsWith('4'); 
    }
    
    /**
     * @returns {boolean} True si és error de vista/renderitzat
     */
    isViewError() { 
        return this.codiCausa.startsWith('5'); 
    }
    
    /**
     * @returns {boolean} True si és error de desenvolupament
     */
    isDevelopmentError() { 
        return this.codiCausa.startsWith('6'); 
    }
}