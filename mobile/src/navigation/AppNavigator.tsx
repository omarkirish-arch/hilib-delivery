import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Role } from '../types';
import CatalogScreen from '../screens/customer/CatalogScreen';
import ActiveDeliveryScreen from '../screens/driver/ActiveDeliveryScreen';

interface AppNavigatorProps {
  userRole?: Role;
}

export default function AppNavigator({ userRole = 'DRIVER' }: AppNavigatorProps) {
  const [activeRole, setActiveRole] = useState<Role>(userRole);
  const [activeTab, setActiveTab] = useState<'catalog' | 'active_delivery' | 'history'>('catalog');

  return (
    <View style={styles.container}>
      {/* Simulation / Selector de rôle en haut pour test facile */}
      <View style={styles.roleSwitcher}>
        <Text style={styles.roleLabel}>Mode Rôle :</Text>
        <TouchableOpacity
          style={[styles.roleBtn, activeRole === 'CUSTOMER' && styles.roleBtnActive]}
          onPress={() => setActiveRole('CUSTOMER')}
        >
          <Text style={[styles.roleBtnText, activeRole === 'CUSTOMER' && styles.roleBtnTextActive]}>
            🛒 Client
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleBtn, activeRole === 'DRIVER' && styles.roleBtnActive]}
          onPress={() => setActiveRole('DRIVER')}
        >
          <Text style={[styles.roleBtnText, activeRole === 'DRIVER' && styles.roleBtnTextActive]}>
            🛵 Livreur
          </Text>
        </TouchableOpacity>
      </View>

      {/* Rendu dynamique de l'écran selon le rôle et le composant */}
      <View style={styles.content}>
        {activeRole === 'CUSTOMER' ? (
          <CatalogScreen />
        ) : (
          <ActiveDeliveryScreen />
        )}
      </View>

      {/* Navigation Tab Bar Bas de page */}
      <View style={styles.tabBar}>
        {activeRole === 'CUSTOMER' ? (
          <>
            <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('catalog')}>
              <Text style={styles.tabIcon}>🥩</Text>
              <Text style={styles.tabText}>Catalogue</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tabItem}>
              <Text style={styles.tabIcon}>🛒</Text>
              <Text style={styles.tabText}>Panier</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tabItem}>
              <Text style={styles.tabIcon}>📋</Text>
              <Text style={styles.tabText}>Commandes</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('active_delivery')}>
              <Text style={styles.tabIcon}>📦</Text>
              <Text style={styles.tabText}>Course Active</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tabItem}>
              <Text style={styles.tabIcon}>💰</Text>
              <Text style={styles.tabText}>Bilan & Gains</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tabItem}>
              <Text style={styles.tabIcon}>👤</Text>
              <Text style={styles.tabText}>Profil Livreur</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  roleSwitcher: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#1E293B',
  },
  roleLabel: {
    color: '#94A3B8',
    fontWeight: '600',
    fontSize: 13,
  },
  roleBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#334155',
  },
  roleBtnActive: {
    backgroundColor: '#E11D48',
  },
  roleBtnText: {
    color: '#CBD5E1',
    fontWeight: '600',
    fontSize: 13,
  },
  roleBtnTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    height: 65,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
  },
  tabIcon: {
    fontSize: 20,
  },
  tabText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
});

