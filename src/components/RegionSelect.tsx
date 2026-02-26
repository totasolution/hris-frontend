import { useCallback } from 'react';
import AsyncSelect from 'react-select/async';
import type { RegionItem } from '../services/api';
import { getRegionsProvinces, getRegionsDistricts, getRegionsSubDistricts } from '../services/api';

type RegionSelectProps = {
  label: string;
  type: 'province' | 'district' | 'sub_district';
  provinceId?: string;
  districtId?: string;
  value?: string;
  onChange: (name: string, id?: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
};

const selectStyles = {
  control: (base: object) => ({
    ...base,
    minHeight: 42,
    borderRadius: 12,
    borderColor: 'rgb(226 232 240)',
    backgroundColor: 'rgb(248 250 252)',
  }),
  option: (base: object, state: { isSelected?: boolean; isFocused?: boolean }) => ({
    ...base,
    backgroundColor: state.isSelected ? '#107BC7' : state.isFocused ? '#E8F5FF' : 'white',
    color: state.isSelected ? 'white' : '#282828',
  }),
};

export function RegionSelect({
  label,
  type,
  provinceId,
  districtId,
  value,
  onChange,
  placeholder,
  disabled,
  required,
}: RegionSelectProps) {
  const loadOptions = useCallback(
    async (input: string): Promise<{ value: string; label: string; id: string }[]> => {
      try {
        let list: RegionItem[] = [];
        if (type === 'province') {
          list = await getRegionsProvinces(input || undefined);
        } else if (type === 'district' && provinceId) {
          list = await getRegionsDistricts(provinceId, input || undefined);
        } else if (type === 'sub_district' && districtId) {
          list = await getRegionsSubDistricts(districtId, input || undefined);
        }
        return list.map((item) => ({ value: item.name, label: item.name, id: item.id }));
      } catch {
        return [];
      }
    },
    [type, provinceId, districtId]
  );

  const selectedOption = value ? { value, label: value, id: '' } : null;
  const canLoad = type === 'province' || (type === 'district' && provinceId) || (type === 'sub_district' && districtId);

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <AsyncSelect<{ value: string; label: string; id: string }>
        cacheOptions
        defaultOptions
        loadOptions={canLoad ? loadOptions : () => Promise.resolve([])}
        value={selectedOption}
        onChange={(opt) => onChange(opt?.value ?? '', opt?.id)}
        placeholder={placeholder ?? (type === 'province' ? 'Cari provinsi...' : type === 'district' ? 'Cari kabupaten/kota...' : 'Cari kecamatan...')}
        isDisabled={disabled || !canLoad}
        isClearable
        noOptionsMessage={({ inputValue }) => (inputValue ? 'Tidak ditemukan' : 'Ketik untuk mencari...')}
        loadingMessage={() => 'Memuat...'}
        styles={selectStyles}
        classNamePrefix="region-select"
      />
    </div>
  );
}
