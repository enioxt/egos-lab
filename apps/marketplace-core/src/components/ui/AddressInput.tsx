'use client';

import { useState, useCallback } from 'react';
import { MapPin, Loader2, Search } from 'lucide-react';

export interface AddressData {
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

interface AddressInputProps {
  value: AddressData;
  onChange: (address: AddressData) => void;
  required?: boolean;
  compact?: boolean;
}

const EMPTY_ADDRESS: AddressData = {
  cep: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
};

export function AddressInput({ value, onChange, required = false, compact = false }: AddressInputProps) {
  const [loading, setLoading] = useState(false);
  const [cepError, setCepError] = useState('');
  const [manualMode, setManualMode] = useState(false);

  const formatCep = (raw: string) => {
    const numbers = raw.replace(/\D/g, '');
    if (numbers.length <= 5) return numbers;
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  };

  const fetchAddressByCep = useCallback(async (cep: string) => {
    const clean = cep.replace(/\D/g, '');
    if (clean.length !== 8) return;

    setLoading(true);
    setCepError('');

    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const data = await res.json();

      if (data.erro) {
        setCepError('CEP não encontrado');
        setManualMode(true);
        return;
      }

      onChange({
        ...value,
        cep: formatCep(clean),
        street: data.logradouro || '',
        neighborhood: data.bairro || '',
        city: data.localidade || '',
        state: data.uf || '',
      });
      setManualMode(false);
    } catch {
      setCepError('Erro ao buscar CEP');
      setManualMode(true);
    } finally {
      setLoading(false);
    }
  }, [value, onChange]);

  const handleCepChange = (raw: string) => {
    const formatted = formatCep(raw);
    onChange({ ...value, cep: formatted });
    setCepError('');

    const clean = raw.replace(/\D/g, '');
    if (clean.length === 8) {
      fetchAddressByCep(clean);
    }
  };

  const update = (field: keyof AddressData, val: string) => {
    onChange({ ...value, [field]: val });
  };

  const inputClass = "w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm";
  const labelClass = "block text-sm text-gray-400 mb-1";

  return (
    <div className="space-y-3">
      {/* CEP */}
      <div>
        <label className={labelClass}>
          <MapPin className="w-4 h-4 inline mr-1" />
          CEP {required && <span className="text-red-400">*</span>}
        </label>
        <div className="relative">
          <input
            type="text"
            value={value.cep}
            onChange={(e) => handleCepChange(e.target.value)}
            placeholder="00000-000"
            maxLength={9}
            className={inputClass}
            required={required}
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400 animate-spin" />
          )}
        </div>
        {cepError && (
          <p className="text-red-400 text-xs mt-1">{cepError}</p>
        )}
        {!value.cep && !manualMode && (
          <button
            type="button"
            onClick={() => setManualMode(true)}
            className="text-xs text-amber-400 hover:text-amber-300 mt-1 flex items-center gap-1"
          >
            <Search className="w-3 h-3" />
            Não sei meu CEP
          </button>
        )}
      </div>

      {/* Street (auto-filled or manual) */}
      {(value.street || manualMode) && (
        <>
          <div>
            <label className={labelClass}>Rua / Avenida</label>
            <input
              type="text"
              value={value.street}
              onChange={(e) => update('street', e.target.value)}
              placeholder="Nome da rua"
              className={inputClass}
              readOnly={!manualMode && !!value.street}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Número</label>
              <input
                type="text"
                value={value.number}
                onChange={(e) => update('number', e.target.value)}
                placeholder="Nº"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Complemento</label>
              <input
                type="text"
                value={value.complement}
                onChange={(e) => update('complement', e.target.value)}
                placeholder="Apto, bloco..."
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Bairro</label>
            <input
              type="text"
              value={value.neighborhood}
              onChange={(e) => update('neighborhood', e.target.value)}
              placeholder="Bairro"
              className={inputClass}
              readOnly={!manualMode && !!value.neighborhood}
            />
          </div>

          {!compact && (
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className={labelClass}>Cidade</label>
                <input
                  type="text"
                  value={value.city}
                  onChange={(e) => update('city', e.target.value)}
                  placeholder="Cidade"
                  className={inputClass}
                  readOnly={!manualMode && !!value.city}
                />
              </div>
              <div>
                <label className={labelClass}>UF</label>
                <input
                  type="text"
                  value={value.state}
                  onChange={(e) => update('state', e.target.value.toUpperCase())}
                  placeholder="UF"
                  maxLength={2}
                  className={inputClass}
                  readOnly={!manualMode && !!value.state}
                />
              </div>
            </div>
          )}
        </>
      )}

      {/* Summary when compact and address filled */}
      {compact && value.city && (
        <p className="text-xs text-gray-400">
          {value.street}{value.number ? `, ${value.number}` : ''} — {value.neighborhood} — {value.city}/{value.state}
        </p>
      )}
    </div>
  );
}

export { EMPTY_ADDRESS };
