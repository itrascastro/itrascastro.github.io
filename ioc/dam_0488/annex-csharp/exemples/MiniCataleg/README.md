# MiniCataleg · Exemple de la Unitat 0

Aquest projecte és l'exemple **executable** del bloc A4 de l'annex d'iniciació a C# de DAM_0488.

## Obrir-lo

1. Necessiteu **Windows** i **Visual Studio**, amb la càrrega de treball de desenvolupament d'escriptori .NET i un SDK compatible amb el `TargetFramework` del projecte.
2. Obriu `MiniCataleg.csproj` a Visual Studio. No cal crear cap solució `.sln` o `.slnx` manualment.
3. Premeu **F5** per executar el formulari.
4. Proveu d'afegir `Teclat` amb quantitat `5` i `Ratolí` amb quantitat `12`. També proveu un nom buit i una quantitat negativa o no numèrica.

## Fitxers

- `Producte.cs`: model de dades (nom, quantitat, representació amb `ToString`).
- `GestorProductes.cs`: manté la llista i el recompte.
- `Form1.cs`: gestiona l'esdeveniment Click, valida entrades i actualitza la pantalla.
- `Form1.Designer.cs`: configura els controls del formulari; **no s'ha d'editar manualment** quan es treballa amb Visual Studio.
- `Program.cs`: punt d'entrada de l'aplicació.

Els fitxers `Producte.cs`, `GestorProductes.cs` i `Form1.cs` reprodueixen els fragments de codi complets del material. El dissenyador del projecte descarregat serveix per obrir la miniaplicació sense haver de col·locar els controls manualment, però **el valor didàctic és que també aprengueu a crear-los des del dissenyador**.

L'exemple és deliberadament petit: no té persistència. El projecte **GestorEstocBotiga** de la Unitat 1 amplia aquests conceptes.
