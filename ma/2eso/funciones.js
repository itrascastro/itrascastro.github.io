function corregirExamen(){var e=document.getElementsByName("respuesta1")[0].value.toLowerCase(),a=document.getElementsByName("respuesta2")[0].value.toLowerCase(),t=document.getElementsByName("respuesta3")[0].value.toLowerCase(),s=document.getElementsByName("respuesta4")[0].value.toLowerCase(),o=document.getElementsByName("respuesta5")[0].value.toLowerCase(),r=document.getElementsByName("respuesta6")[0].value.toLowerCase(),m=document.getElementsByName("respuesta7")[0].value.toLowerCase(),u=document.getElementsByName("respuesta8")[0].value.toLowerCase(),l=document.getElementsByName("respuesta9")[0].value.toLowerCase(),n=document.getElementsByName("respuesta10")[0].value.toLowerCase(),p=0;"pendiente"===e&&p++,"ordenada en el origen"===a&&p++,"y = mx + b"===t&&p++,"5x + 2"===s&&p++,"(4, 14)"===o&&p++,"2"===r&&p++,"m = 3/4"===m&&p++,"tabla de puntos"===u&&p++,"recta"===l&&p++,"y = -2x + 7"===n&&p++,alert("Has obtenido "+p+" puntos.")}