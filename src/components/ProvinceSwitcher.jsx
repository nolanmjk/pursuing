import { Select } from 'antd';
import provincesData from '../data/provinces.json';
import { useAppContext } from '../context/AppContext';

export default function ProvinceSwitcher() {
  const { selectedProvince, setSelectedProvince } = useAppContext();

  return (
    <Select
      value={selectedProvince}
      onChange={setSelectedProvince}
      style={{ width: 120 }}
      options={provincesData.map(p => ({ value: p.name, label: p.name }))}
    />
  );
}
