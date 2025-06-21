import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BaseToast, ErrorToast, InfoToast } from 'react-native-toast-message';
import { Icon } from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';

export const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={[styles.base, styles.success]}
      contentContainerStyle={styles.contentContainer}
      text1Style={styles.text1}
      text2Style={styles.text2}
      renderLeadingIcon={() => (
        <Icon
          as={MaterialIcons}
          name="check-circle"
          size={6}
          color={colors.success}
          style={styles.icon}
        />
      )}
    />
  ),
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={[styles.base, styles.error]}
      contentContainerStyle={styles.contentContainer}
      text1Style={styles.text1}
      text2Style={styles.text2}
      renderLeadingIcon={() => (
        <Icon as={MaterialIcons} name="error" size={6} color={colors.error} style={styles.icon} />
      )}
    />
  ),
  info: (props: any) => (
    <InfoToast
      {...props}
      style={[styles.base, styles.info]}
      contentContainerStyle={styles.contentContainer}
      text1Style={styles.text1}
      text2Style={styles.text2}
      renderLeadingIcon={() => (
        <Icon as={MaterialIcons} name="info" size={6} color={colors.info} style={styles.icon} />
      )}
    />
  ),
  custom: ({ text1, text2, props: _props }: any) => (
    <View style={[styles.base, styles.custom]}>
      <View style={styles.contentContainer}>
        <Text style={styles.text1}>{text1}</Text>
        {text2 && <Text style={styles.text2}>{text2}</Text>}
      </View>
    </View>
  ),
};

const styles = StyleSheet.create({
  base: {
    borderLeftWidth: 5,
    width: '90%',
    minHeight: 60,
    backgroundColor: colors.surface,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  success: {
    borderLeftColor: colors.success,
  },
  error: {
    borderLeftColor: colors.error,
  },
  info: {
    borderLeftColor: colors.info,
  },
  custom: {
    borderLeftColor: colors.primary,
  },
  contentContainer: {
    paddingHorizontal: 15,
    justifyContent: 'center',
  },
  text1: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    fontFamily: 'Roboto-Bold',
  },
  text2: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: 'Roboto',
    marginTop: 2,
  },
  icon: {
    marginLeft: 10,
  },
});
