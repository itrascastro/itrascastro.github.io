namespace MiniCataleg;

partial class Form1
{
    private System.ComponentModel.IContainer? components = null;
    private TextBox txtNom = null!;
    private TextBox txtQuantitat = null!;
    private Button btnAfegir = null!;
    private ListBox lstProductes = null!;
    private Label lblTotal = null!;
    private Label lblNom = null!;
    private Label lblQuantitat = null!;

    protected override void Dispose(bool disposing)
    {
        if (disposing && components is not null)
        {
            components.Dispose();
        }
        base.Dispose(disposing);
    }

    private void InitializeComponent()
    {
        txtNom = new TextBox();
        txtQuantitat = new TextBox();
        btnAfegir = new Button();
        lstProductes = new ListBox();
        lblTotal = new Label();
        lblNom = new Label();
        lblQuantitat = new Label();
        SuspendLayout();
        // 
        // lblNom
        // 
        lblNom.AutoSize = true;
        lblNom.Location = new Point(24, 24);
        lblNom.Text = "Nom del producte";
        // 
        // txtNom
        // 
        txtNom.Location = new Point(24, 49);
        txtNom.Name = "txtNom";
        txtNom.Size = new Size(244, 23);
        txtNom.TabIndex = 0;
        // 
        // lblQuantitat
        // 
        lblQuantitat.AutoSize = true;
        lblQuantitat.Location = new Point(24, 90);
        lblQuantitat.Text = "Quantitat";
        // 
        // txtQuantitat
        // 
        txtQuantitat.Location = new Point(24, 115);
        txtQuantitat.Name = "txtQuantitat";
        txtQuantitat.Size = new Size(244, 23);
        txtQuantitat.TabIndex = 1;
        // 
        // btnAfegir
        // 
        btnAfegir.Location = new Point(24, 158);
        btnAfegir.Name = "btnAfegir";
        btnAfegir.Size = new Size(244, 34);
        btnAfegir.TabIndex = 2;
        btnAfegir.Text = "Afegir";
        btnAfegir.UseVisualStyleBackColor = true;
        // 
        // lstProductes
        // 
        lstProductes.FormattingEnabled = true;
        lstProductes.ItemHeight = 15;
        lstProductes.Location = new Point(304, 49);
        lstProductes.Name = "lstProductes";
        lstProductes.Size = new Size(259, 244);
        lstProductes.TabIndex = 3;
        // 
        // lblTotal
        // 
        lblTotal.AutoSize = true;
        lblTotal.Location = new Point(304, 307);
        lblTotal.Name = "lblTotal";
        lblTotal.Text = "Productes: 0";
        // 
        // Form1
        // 
        AutoScaleDimensions = new SizeF(7F, 15F);
        AutoScaleMode = AutoScaleMode.Font;
        ClientSize = new Size(591, 357);
        Controls.Add(lblNom);
        Controls.Add(txtNom);
        Controls.Add(lblQuantitat);
        Controls.Add(txtQuantitat);
        Controls.Add(btnAfegir);
        Controls.Add(lstProductes);
        Controls.Add(lblTotal);
        Name = "Form1";
        StartPosition = FormStartPosition.CenterScreen;
        Text = "MiniCataleg - Annex DAM_0488";
        ResumeLayout(false);
        PerformLayout();
    }
}
