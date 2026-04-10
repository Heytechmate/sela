import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';

export type Orientation = 'portrait' | 'landscape';

export function useOrientation(): Orientation {
  const [orientation, setOrientation] = useState<Orientation>(
    Dimensions.get('window').width > Dimensions.get('window').height
      ? 'landscape'
      : 'portrait'
  );

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setOrientation(window.width > window.height ? 'landscape' : 'portrait');
    });
    return () => sub.remove();
  }, []);

  return orientation;
}

export function useWindowDimensions() {
  const [dims, setDims] = useState(Dimensions.get('window'));

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setDims(window);
    });
    return () => sub.remove();
  }, []);

  return dims;
}
