import { Text, View } from 'react-native';
import { formatKoreanDateHeader } from '@/lib/dateFormat';
import { colors, typography } from '@/theme';

interface DateHeaderProps {
  dateString: string;
}

export function DateHeader({ dateString }: DateHeaderProps) {
  return (
    <View>
      <Text style={styles.dateTitle}>{formatKoreanDateHeader(dateString)}</Text>
    </View>
  );
}

const styles = {
  dateTitle: {
    ...typography.display,
    color: colors.text,
    marginBottom: 16,
  },
};
