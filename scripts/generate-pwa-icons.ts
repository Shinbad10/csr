import sharp from "sharp";
import path from "path";
import fs from "fs";

async function main() {
  const logoPath = path.join(process.cwd(), "public", "logo.png");
  if (!fs.existsSync(logoPath)) {
    console.error("public/logo.png not found!");
    return;
  }

  console.log("Reading logo from:", logoPath);
  const logoBuffer = fs.readFileSync(logoPath);
  const metadata = await sharp(logoBuffer).metadata();
  console.log("Logo metadata:", metadata.width, "x", metadata.height, metadata.format);

  // Generate 192x192 icon with subtle padding for maskable/standard icons
  const icon192 = await sharp(logoBuffer)
    .resize(192, 192, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(process.cwd(), "public", "icon-192.png"), icon192);
  console.log("✓ Generated public/icon-192.png");

  // Generate 512x512 icon
  const icon512 = await sharp(logoBuffer)
    .resize(512, 512, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(process.cwd(), "public", "icon-512.png"), icon512);
  console.log("✓ Generated public/icon-512.png");

  // Generate apple-touch-icon 180x180
  const appleIcon = await sharp(logoBuffer)
    .resize(180, 180, {
      fit: "contain",
      background: { r: 10, g: 27, b: 63, alpha: 1 }, // Navy brand color
    })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(process.cwd(), "public", "apple-touch-icon.png"), appleIcon);
  console.log("✓ Generated public/apple-touch-icon.png");

  console.log("All PWA icons generated successfully from logo.png!");
}

main().catch(console.error);
