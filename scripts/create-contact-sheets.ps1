Add-Type -AssemblyName System.Drawing

$files = Get-ChildItem -LiteralPath "public/assets/source" -File | Where-Object { $_.Extension -match '^\.(jpg|jpeg|png)$' }
$chunkSize = 30
$thumbWidth = 220
$thumbHeight = 150
$cols = 5
$rows = 6

for ($offset = 0; $offset -lt $files.Count; $offset += $chunkSize) {
  $page = [Math]::Floor($offset / $chunkSize) + 1
  $bitmap = New-Object System.Drawing.Bitmap ($cols * $thumbWidth), ($rows * ($thumbHeight + 28))
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.Clear([System.Drawing.Color]::FromArgb(245, 242, 235))
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $font = New-Object System.Drawing.Font "Arial", 10
  $brush = [System.Drawing.Brushes]::Black

  $slice = $files | Select-Object -Skip $offset -First $chunkSize
  for ($i = 0; $i -lt $slice.Count; $i++) {
    $file = $slice[$i]
    $col = $i % $cols
    $row = [Math]::Floor($i / $cols)
    $x = $col * $thumbWidth
    $y = $row * ($thumbHeight + 28)
    try {
      $image = [System.Drawing.Image]::FromFile($file.FullName)
      $ratio = [Math]::Min(($thumbWidth - 8) / $image.Width, ($thumbHeight - 8) / $image.Height)
      $width = [int]($image.Width * $ratio)
      $height = [int]($image.Height * $ratio)
      $graphics.DrawImage($image, $x + (($thumbWidth - $width) / 2), $y + (($thumbHeight - $height) / 2), $width, $height)
      $image.Dispose()
    } catch {}
    $label = $file.Name.Substring(0, [Math]::Min(3, $file.Name.Length))
    $graphics.DrawString($label, $font, $brush, $x + 8, $y + $thumbHeight + 4)
  }

  $bitmap.Save("source/contact-sheet-$page.jpg", [System.Drawing.Imaging.ImageFormat]::Jpeg)
  $graphics.Dispose()
  $bitmap.Dispose()
  $font.Dispose()
}
