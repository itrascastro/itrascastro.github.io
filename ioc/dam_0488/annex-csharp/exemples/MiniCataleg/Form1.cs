namespace MiniCataleg;

public partial class Form1 : Form
{
    private readonly GestorProductes gestor = new();

    public Form1()
    {
        InitializeComponent();
        btnAfegir.Click += BtnAfegir_Click;
    }

    private void BtnAfegir_Click(object? sender, EventArgs e)
    {
        string nom = txtNom.Text.Trim();

        if (nom.Length == 0)
        {
            MessageBox.Show("Cal indicar el nom del producte.");
            txtNom.Focus();
            return;
        }

        if (!int.TryParse(txtQuantitat.Text, out int quantitat)
            || quantitat < 0)
        {
            MessageBox.Show("La quantitat ha de ser un enter no negatiu.");
            txtQuantitat.Focus();
            return;
        }

        Producte nou = new Producte(nom, quantitat);
        gestor.Afegir(nou);
        lstProductes.Items.Add(nou);
        lblTotal.Text = "Productes: " + gestor.Total;

        txtNom.Clear();
        txtQuantitat.Clear();
        txtNom.Focus();
    }
}
