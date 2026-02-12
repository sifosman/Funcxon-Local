import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '../theme';

type Prediction = {
  description: string;
  place_id: string;
};

type Props = {
  label: string;
  placeholder: string;
  value: string;
  onChangeValue: (value: string) => void;
  numberOfLines?: number;
  required?: boolean;
  error?: string;
};

export function AddressAutocompleteInput({
  label,
  placeholder,
  value,
  onChangeValue,
  numberOfLines = 2,
  required,
  error,
}: Props) {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [query, setQuery] = useState(value);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const requestSeq = useRef(0);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const canSearch = useMemo(() => {
    return Boolean(apiKey) && query.trim().length >= 3;
  }, [apiKey, query]);

  useEffect(() => {
    const trimmed = query.trim();

    if (!open) return;

    if (!apiKey) {
      setPredictions([]);
      return;
    }

    if (trimmed.length < 3) {
      setPredictions([]);
      return;
    }

    const seq = ++requestSeq.current;
    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const url =
          `https://maps.googleapis.com/maps/api/place/autocomplete/json` +
          `?input=${encodeURIComponent(trimmed)}` +
          `&key=${encodeURIComponent(apiKey)}` +
          `&types=address`;

        const res = await fetch(url);
        const json = await res.json();

        if (seq !== requestSeq.current) return;

        const next: Prediction[] = Array.isArray(json?.predictions)
          ? json.predictions
              .filter((p: any) => typeof p?.description === 'string' && typeof p?.place_id === 'string')
              .map((p: any) => ({ description: p.description, place_id: p.place_id }))
          : [];

        setPredictions(next);
      } catch {
        if (seq === requestSeq.current) {
          setPredictions([]);
        }
      } finally {
        if (seq === requestSeq.current) {
          setLoading(false);
        }
      }
    }, 300);

    return () => clearTimeout(handle);
  }, [apiKey, open, query]);

  const handleSelect = (prediction: Prediction) => {
    onChangeValue(prediction.description);
    setOpen(false);
    setPredictions([]);
    Keyboard.dismiss();
  };

  return (
    <View>
      <Text style={{ ...typography.body, fontWeight: '500', color: colors.textPrimary, marginBottom: spacing.xs }}>
        {label}
        {required ? ' *' : ''}
      </Text>

      <View
        style={{
          borderWidth: 1,
          borderColor: error ? '#EF4444' : colors.borderSubtle,
          borderRadius: radii.md,
          backgroundColor: colors.surface,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: spacing.sm,
        }}
      >
        <View style={{ flex: 1 }}>
          <TextInput
            placeholder={placeholder}
            value={query}
            onFocus={() => setOpen(true)}
            onBlur={() => {
              setOpen(false);
            }}
            onChangeText={(text) => {
              setQuery(text);
              onChangeValue(text);
            }}
            multiline
            numberOfLines={numberOfLines}
            style={{
              fontSize: 14,
              color: colors.textPrimary,
              textAlignVertical: 'top',
              padding: 0,
              margin: 0,
            }}
          />
        </View>

        <TouchableOpacity
          onPress={() => {
            if (!apiKey) return;
            setOpen(true);
          }}
          style={{ paddingTop: 2 }}
          activeOpacity={0.7}
          disabled={!apiKey}
        >
          <MaterialIcons name="search" size={20} color={apiKey ? colors.primaryTeal : colors.textMuted} />
        </TouchableOpacity>
      </View>

      {error && <Text style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>{error}</Text>}

      {open && (
        <View
          style={{
            marginTop: spacing.xs,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
            borderRadius: radii.md,
            backgroundColor: colors.surface,
            overflow: 'hidden',
          }}
        >
          {!apiKey && (
            <View style={{ padding: spacing.md }}>
              <Text style={{ ...typography.caption, color: colors.textMuted }}>
                Address search is unavailable.
              </Text>
            </View>
          )}

          {apiKey && (
            <View>
              {loading && (
                <View style={{ padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <ActivityIndicator size="small" color={colors.primaryTeal} />
                  <Text style={{ ...typography.caption, color: colors.textMuted }}>Searching…</Text>
                </View>
              )}

              {!loading && canSearch && predictions.length === 0 && (
                <View style={{ padding: spacing.md }}>
                  <Text style={{ ...typography.caption, color: colors.textMuted }}>No results</Text>
                </View>
              )}

              {!loading && query.trim().length < 3 && (
                <View style={{ padding: spacing.md }}>
                  <Text style={{ ...typography.caption, color: colors.textMuted }}>Type at least 3 characters</Text>
                </View>
              )}

              <FlatList
                keyboardShouldPersistTaps="handled"
                data={predictions}
                keyExtractor={(item) => item.place_id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => handleSelect(item)}
                    style={{
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.sm,
                      borderTopWidth: 1,
                      borderTopColor: colors.borderSubtle,
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={{ ...typography.body, color: colors.textPrimary, fontSize: 13 }}>
                      {item.description}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
        </View>
      )}
    </View>
  );
}
