namespace MiniCataleg;

public class Producte
{
    public string Nom { get; }
    public int Quantitat { get; }

    public Producte(string nom, int quantitat)
    {
        Nom = nom;
        Quantitat = quantitat;
    }

    public override string ToString()
    {
        return Nom + " (" + Quantitat + ")";
    }
}
