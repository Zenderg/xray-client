import './Settings.css'

import React, { useState, useEffect } from 'react';
import { backend } from '../utils/backend';
import { Button, Flex, FormControl, FormLabel, Heading, Input, Textarea, useToast } from '@chakra-ui/react';

const Settings = () => {
  const toast = useToast()

  const [vpnConfig, setVpnConfig] = useState('');
  const [routerConfig, setRouterConfig] = useState({
    ssh: { host: '', username: '', password: '' },
    redirectIp: '',
    redirectPort: ''
  });

  useEffect(() => {
    fetchVpnConfig();
    fetchRouterConfig();
  }, []);

  const fetchVpnConfig = async () => {
    try {
        const response = await backend.get('/vpn-config');
        setVpnConfig(Object.keys(response.data).length > 0 
        ? JSON.stringify(response.data, null, 2)
        : '{\n  "inbounds": [],\n  "outbounds": []\n}');
    } catch (error) {
        console.error('Error loading VPN config:', error);
    }
  };

  const saveVpnConfig = async () => {
    try {
        const config = JSON.parse(vpnConfig);
        await backend.post('/vpn-config', config);
        toast({
          title: 'VPN config saved successfully',
          status: 'success',
        })
      } catch (error) {
        toast({
          title: 'Error saving VPN config',
          description: error,
          status: 'error',
        })
      }
  }

  const fetchRouterConfig = async () => {
    try {
      const response = await backend.get('/router-config');
      setRouterConfig(response.data);
    } catch (error) {
      toast({
        title: 'Error fetching router config',
        description: error,
        status: 'error',
      })
    }
  };

  const saveRouterConfig = async () => {
    try {
      await backend.post('/router-config', routerConfig);
      toast({
        title: 'Router config saved successfully',
        status: 'success',
      })
    } catch (error) {
      toast({
        title: 'Error saving router config',
        description: error,
        status: 'error',
      })
    }
  };

  return (
    <div>
      <Heading mb={4} as='h4' size='md'>
      VPN Settings
      </Heading>

      <Textarea className='vpn-config' value={vpnConfig} onChange={(e) => setVpnConfig(e.target.value)} />

      <div className='vpn-controls'>
        <Button onClick={saveVpnConfig}>Save VPN Config</Button>
      </div>

      <Heading mb={4} as='h4' size='md'>
        Router settings
      </Heading>
      <FormControl>
        <FormLabel>SSH Host</FormLabel>
        <Input
            type="text"
            value={routerConfig.ssh.host}
            onChange={(e) => setRouterConfig({...routerConfig, ssh: {...routerConfig.ssh, host: e.target.value}})}
          />
      </FormControl>
      <FormControl>
        <FormLabel>SSH Username</FormLabel>
        <Input
            type="text"
            value={routerConfig.ssh.username}
            onChange={(e) => setRouterConfig({...routerConfig, ssh: {...routerConfig.ssh, username: e.target.value}})}
          />
      </FormControl>
      <FormControl>
        <FormLabel>SSH Password</FormLabel>
        <Input
            type="password"
            value={routerConfig.ssh.password}
            onChange={(e) => setRouterConfig({...routerConfig, ssh: {...routerConfig.ssh, password: e.target.value}})}
          />
      </FormControl>
      <FormControl>
        <FormLabel>Redirect IP</FormLabel>
        <Input
            type="text"
            value={routerConfig.redirectIp}
            onChange={(e) => setRouterConfig({...routerConfig, redirectIp: e.target.value})}
          />
      </FormControl>
      <FormControl>
        <FormLabel>Redirect Port</FormLabel>
        <Input
            type="text"
            value={routerConfig.redirectPort}
            onChange={(e) => setRouterConfig({...routerConfig, redirectPort: e.target.value})}
          />
      </FormControl>

      <Flex mt={4} gap={2}>
      <Button onClick={saveRouterConfig}>Save Router Config</Button>
      </Flex>
    </div>
  );
};

export default Settings;