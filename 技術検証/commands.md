One-line command (no line breaks):

```bash
curl -i -H "X-Goog-Api-Key: $GOOGLE_MAPS_API_KEY" -H "X-Goog-FieldMask: id,displayName,currentOpeningHours,regularOpeningHours" "https://places.googleapis.com/v1/places/ChIJRZf7Z0H1FzUR0r3rVd7YH6c?languageCode=ja"
```

Find Place (Place ID lookup):

```bash
curl -s "https://places.googleapis.com/v1/places:findPlaceFromText" -H "Content-Type: application/json" -H "X-Goog-Api-Key: $GOOGLE_MAPS_API_KEY" -H "X-Goog-FieldMask: places.id,places.displayName,places.formattedAddress" -d '{"input":"八丈ストア","inputType":"TEXT_QUERY","languageCode":"ja"}' | jq .
```

Find Place (no jq):

```bash
curl -s "https://places.googleapis.com/v1/places:findPlaceFromText" -H "Content-Type: application/json" -H "X-Goog-Api-Key: $GOOGLE_MAPS_API_KEY" -H "X-Goog-FieldMask: places.id,places.displayName,places.formattedAddress" -d '{"input":"八丈ストア","inputType":"TEXT_QUERY","languageCode":"ja"}'
```
