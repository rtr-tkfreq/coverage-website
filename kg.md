# Administrative borders (KG / municipalities)

basemap.at's vector basemap has **no Katastralgemeinde (KG)** layer, and its
municipality/district border geometry is inaccurate, so the basemap borders are
hidden (see `adjustProminence()` in `src/app/map/map.service.ts`).

Instead, you can supply your **own accurate borders as a GeoJSON file** and the
map will render them automatically.

## Where to put the file

```
coverage-website/src/assets/admin-borders.geojson
```

Angular copies `src/assets/**` into the build, so the file is served at
`/assets/admin-borders.geojson` and loaded automatically on map startup.

- **No code change is required.** If the file is present it renders; if it is
  absent it is silently skipped (no error).
- The path/filename are configured by `ADMIN_BORDERS_URL` near the top of
  `src/app/map/map.service.ts`.

## Expected format

- A standard **GeoJSON `FeatureCollection`**.
- Coordinates in **WGS84 / EPSG:4326** — plain `[longitude, latitude]` (the
  GeoJSON default). Do **not** use EPSG:3857 / projected coordinates.
- Geometry types: **`Polygon` / `MultiPolygon`** (KG or municipality areas — the
  map draws their outlines) **or** **`LineString` / `MultiLineString`** (border
  lines). Both work.

Minimal example:

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": { "name": "Beispiel-KG", "kgnr": "12345" },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[14.30, 48.30], [14.31, 48.30], [14.31, 48.31], [14.30, 48.30]]]
      }
    }
  ]
}
```

## How it renders

- Drawn as lines in **`#6f7294`**, width `1.2`, opacity `0.85`.
- Stacked **above** the coverage + obligation overlays (so borders stay visible
  over the coloured coverage) and **below** the clicked-cell highlight.
- Styling lives in `addAdminBorders()` in `src/app/map/map.service.ts`.

## Performance

- Keep the file reasonably small. For a country-wide KG dataset, simplify the
  geometry first (e.g. with [mapshaper](https://mapshaper.org/):
  `mapshaper in.geojson -simplify 10% -o out.geojson`).
- If the dataset is very large (tens of MB), inline GeoJSON will be slow — switch
  to **vector tiles** instead (ask, and the loader can point at a tile source).

## Tweaks

The border colour / width / opacity, optional faint fill, or per-level styling
(e.g. KG vs municipality, keyed off a GeoJSON property) can all be adjusted in
`addAdminBorders()`.
