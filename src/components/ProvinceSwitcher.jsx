import { Tag } from 'antd';
import { useAppContext } from '../context/AppContext';

export default function ProvinceSwitcher() {
  const { selectedProvince } = useAppContext();

  return (
    <Tag className="pursuing-province-tag">
      {selectedProvince}
    </Tag>
  );
}
