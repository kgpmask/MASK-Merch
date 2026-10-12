# Adding designs

Each folder under `designs/artwork/` is **one product design**, containing all its pictures. The six existing designs have been migrated without changing their product URLs or prices.

```text
designs/
  catalog.json
  artwork/
    1/
      01.png
      02-back.png
      03-detail.webp
      size-chart.png
    2/
      01.png
```

Add front, back and detail shots to the same folder. PNG, JPG, JPEG and WebP are supported. Images are sorted by filename (including numeric order); prefix them with `01-`, `02-`, etc. to choose the cover and gallery order. Unsupported source files are ignored. Empty folders do not create products. Root-level images are not imported.

Refresh the store to detect changes. With MongoDB configured, imported designs have real products, size variants and preorder campaigns. Keep folder names stable: folder `1` maps to `/store/products/1`. Renaming gallery images does not change the product URL. Renaming folders creates another listing; archive old listings in admin rather than deleting orders.

## Per-design configuration

Edit the entry keyed by the **folder name** in `catalog.json`, for example `"1"`. Every existing design has individual fields for price, garment, sizes, material, GSM and chart. Missing entries inherit `defaults`.

```json
"1": {
  "title": "Your design title",
  "garmentType": "tshirt",
  "normalPricePaise": 59900,
  "oversizedPricePaise": 69900,
  "normalSizes": ["S", "M", "L", "XL", "XXL"],
  "oversizedSizes": ["OS-S", "OS-M", "OS-L", "OS-XL", "OS-XXL"],
  "colour": "Black",
  "material": "Replace with confirmed vendor fabric",
  "gsm": null,
  "moq": 1,
  "preorderClose": "2027-01-31T18:29:59.000Z",
  "sizeChart": {
    "image": null,
    "columns": ["Size", "Chest (cm)", "Length (cm)"],
    "rows": [],
    "note": "Measurements to be confirmed."
  }
}
```

Set `garmentType` to `tshirt` for a design that offers both normal and oversized fits, or `hoodie` for a hoodie-only design. Design 1 is a T-shirt design and Design 2 is hoodie-only; the other existing designs are T-shirts. Legacy `normal_tshirt` and `oversized_tshirt` configuration values also map to both T-shirt fits.

T-shirts have separate `normalSizes` and `oversizedSizes` arrays and separate `normalPricePaise` and `oversizedPricePaise` prices. Size labels can differ completely, including spaces (for example `OS Small`). The selector shows only the sizes for the chosen fit. `OS-*` labels and the initial INR 599/699 prices are placeholders; replace them with the vendor's actual labels and prices. For hoodies, use `sizes` and `pricePaise` as in Design 2. Legacy shared `sizes`/`pricePaise` fields remain supported as fallbacks for older configurations.

Prices are integer paise (59900 = INR 599). Set `gsm` to a positive integer once confirmed, such as `180`; `null` displays “To be confirmed”. Material, GSM, prices and measurements are placeholders until you supply vendor details. Keep `moq: 1`. Admins still verify payments and manage fulfilment batches.

## Size guide: image, table, or both

The size guide has its own full-width section below the product details.

For an image, drop `size-chart.png` (or JPG/WebP) into the design folder. It is detected automatically and excluded from the product gallery. Alternatively, set `sizeChart.image` to the exact filename of another chart image inside the same folder. Images can be opened at full resolution.

For a table, fill `columns` and `rows`; each row must have exactly one text value per column. For example, replace the empty rows with `[["S", "vendor chest", "vendor length"], ["M", "vendor chest", "vendor length"]]` and replace these example cells with actual measurements. Include measurement units in the headings and describe measurement method/tolerance in `note`. An image and table can be displayed together.

## Sync and deployment

Folder configuration owns imported artwork, title, description, artist credit, material, GSM, chart, prices, sizes, MOQ and deadline. Edit these in JSON rather than the admin dashboard. Changing available sizes or garment deactivates old variants for future purchases. Existing order snapshots, campaign decisions, paid quantities and the admin-controlled product active flag are preserved.

Removing a folder does not delete database products or orders. Archive unused listings in admin.

The standalone production build includes this folder. On immutable hosted services, commit images and JSON and redeploy. On a persistent server, update its deployed `designs/` directory and refresh the catalogue. Files on your laptop do not update a separate hosted deployment. Artwork is public; keep payment proofs and private files elsewhere.
