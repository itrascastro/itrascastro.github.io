#!/usr/bin/env python3
"""Compila tots els fragments C# didàctics en contextos mínims de prova.

No executa Windows Forms: verifica que cada fragment es pugui compilar quan
s'hi afegeixen els controls i classes explícitament mencionats al material.
"""
from pathlib import Path
from html import unescape
import re
import subprocess
import tempfile

ANNEX = Path(__file__).resolve().parents[1]

def code_blocks(bloc):
    page = (ANNEX / f"bloc-{bloc}" / "index.html").read_text(encoding="utf-8")
    return [unescape(m) for m in re.findall(
        r'<code class="language-csharp">([\s\S]*?)</code>', page
    )]

def project(*, winforms=False, output="Exe"):
    win = "-windows" if winforms else ""
    use = "<UseWindowsForms>true</UseWindowsForms>" if winforms else ""
    return (
        f'<Project Sdk="Microsoft.NET.Sdk"><PropertyGroup>'
        f'<TargetFramework>net10.0{win}</TargetFramework>'
        f'<OutputType>{output}</OutputType>'
        f'{use}<ImplicitUsings>enable</ImplicitUsings>'
        f'<Nullable>enable</Nullable></PropertyGroup></Project>'
    )

def build(base, name, sources, winforms=False, output="Exe"):
    directory = base / name
    directory.mkdir()
    (directory / (name + ".csproj")).write_text(
        project(winforms=winforms, output=output), encoding="utf-8"
    )
    for filename, text in sources.items():
        (directory / filename).write_text(text, encoding="utf-8")
    cmd = ["dotnet", "build", str(directory / (name + ".csproj")),
           "--configuration", "Release", "--nologo", "--verbosity", "quiet"]
    run = subprocess.run(cmd, capture_output=True, text=True)
    if run.returncode:
        raise RuntimeError(f"{name} no compila:\n{run.stdout}\n{run.stderr}")
    print("PASS C#:", name)

a1 = code_blocks(1)
a2 = code_blocks(2)
a3 = code_blocks(3)
assert len(a1) == 4, "Nombre de fragments del bloc A1 inesperat"
assert len(a2) == 6, "Nombre de fragments del bloc A2 inesperat"
assert len(a3) == 3, "Nombre de fragments del bloc A3 inesperat"

producte = a2[2] + "\n"
retirar = a2[5]
assert producte.rstrip().endswith("}"), "No acaba la classe Producte"
producte_amb_retirar = producte.rstrip()[:-1] + "\n" + retirar + "\n}\n"

with tempfile.TemporaryDirectory(prefix="dam0488_fragments_") as tmp:
    base = Path(tmp)
    for i, snippet in enumerate(a1, 1):
        build(base, f"A1_{i}", {"Program.cs": snippet})
    build(base, "A2_1", {"Program.cs": a2[0]})
    build(base, "A2_2", {"Program.cs": a2[1]})
    build(base, "A2_3", {"Program.cs": "Console.WriteLine(\"OK\");\n", "Producte.cs": producte})
    build(base, "A2_4", {"Program.cs": a2[3], "Producte.cs": producte})
    build(base, "A2_5", {"Program.cs": a2[4], "Producte.cs": producte})
    build(base, "A2_6", {"Program.cs": "Console.WriteLine(\"OK\");\n",
                         "Producte.cs": producte_amb_retirar})
    wusing = "global using System.Windows.Forms;\n"
    designer = """public partial class Form1
{
    private readonly Button btnSumar = new();
    private readonly Label lblComptador = new();
    private void InitializeComponent() {}
}
"""
    build(base, "A3_1", {"Imports.cs": wusing, "Form1.cs": a3[0],
                          "Form1.Stub.cs": designer},
          winforms=True, output="Library")
    wrapped2 = """using System;
using System.Windows.Forms;
public class Exemple : Form
{
    private readonly Label lblSalutacio = new();
    private readonly TextBox txtNom = new();
""" + a3[1] + "\n}\n"
    build(base, "A3_2", {"Exemple.cs": wrapped2}, winforms=True, output="Library")
    wrapped3 = """using System;
using System.Windows.Forms;
public class Exemple : Form
{
    private readonly Label lblResultat = new();
    private readonly TextBox txtNom = new();
    public void Executa()
    {
""" + a3[2] + "\n    }\n}\n"
    # Les primeres notes del curs introdueixen Producte com a classe sense namespace.
    build(base, "A3_3", {"Exemple.cs": wrapped3, "Producte.cs": producte},
          winforms=True, output="Library")
print("TOTS ELS FRAGMENTS DIDÀCTICS S'HAN COMPILAT")
