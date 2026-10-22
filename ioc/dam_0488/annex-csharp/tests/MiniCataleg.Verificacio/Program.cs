using MiniCataleg;

static void Exigeix(bool condicio, string descripcio)
{
    if (!condicio) throw new Exception("Prova fallida: " + descripcio);
}

var gestor = new GestorProductes();
Exigeix(gestor.Total == 0, "Llista inicialment buida");

var teclat = new Producte("Teclat", 5);
var ratoli = new Producte("Ratolí", 12);

Exigeix(teclat.Nom == "Teclat" && teclat.Quantitat == 5, "El constructor desa dades");
Exigeix(teclat.ToString() == "Teclat (5)", "Representació al ListBox");

gestor.Afegir(teclat);
gestor.Afegir(ratoli);
Exigeix(gestor.Total == 2, "Afegir dos productes");
Exigeix(gestor.Eliminar(teclat), "Eliminar un producte existent");
Exigeix(gestor.Total == 1, "El recompte es redueix");
Exigeix(!gestor.Eliminar(teclat), "Un producte ja eliminat no es pot retirar de nou");
Exigeix(gestor.Total == 1, "El recompte final no es modifica");

Console.WriteLine("Totes les comprovacions del model i gestor han passat.");
