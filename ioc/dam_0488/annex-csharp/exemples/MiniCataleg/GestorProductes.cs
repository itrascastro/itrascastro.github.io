namespace MiniCataleg;

public class GestorProductes
{
    private readonly List<Producte> productes = new();

    public int Total => productes.Count;

    public void Afegir(Producte producte)
    {
        productes.Add(producte);
    }

    public bool Eliminar(Producte producte)
    {
        return productes.Remove(producte);
    }
}
