// src/components/Home.jsx
import React, { useEffect, useState } from 'react';
import { backend } from '../utils/backend';
import { Button, FormControl, FormLabel, Progress, Tag, Textarea, useToast } from '@chakra-ui/react';
import { Switch } from '@chakra-ui/react'
import { WS_URL } from '../constants';

import './Home.css'

const Home = () => {
  const toast = useToast()

    const [domains, setDomains] = useState('');
    const [results, setResults] = useState([]);
    const [xrayStatus, setXrayStatus] = useState('unknown');
    const [progress, setProgress] = useState(100);
    const [vpnEnabled, setVpnEnabled] = useState(false);

    const statusColors = {
      running: 'green',
      stopped: 'red',
      error: 'orange',
      unknown: 'gray',
    }
  
    useEffect(() => {
      loadDomains();
      getInitialXrayStatus();
      connectWebSocket();
      getInitialCidrs();
    }, []);
  
    const connectWebSocket = () => {
        const ws = new WebSocket(`${WS_URL}`);

        ws.onopen = () => {
            console.log('WebSocket connected');
        };
        ws.onmessage = (event) => {
          console.log(event)
            const data = JSON.parse(event.data);
            if (data.type === 'progress') {
              setProgress(data.progress);
            }
  
            if (data.type === 'xrayStatus') {
              setXrayStatus(data.status);
              setVpnEnabled(data.status === 'running')
            }
        };
        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
        ws.onclose = () => {
            console.log('WebSocket disconnected. Trying to reconnect...');
            setTimeout(connectWebSocket, 5000);
        };
    }

  const saveDomains = async () => {
    try {
        const domainsArray = domains.split('\n').filter(domain => domain.trim());
        await backend.post('/domains', { domains: domainsArray });

        toast({
          title: 'Domains saved successfully',
          status: 'success',
        })
      } catch (error) {
        toast({
          title: 'Error saving domains',
          description: error,
          status: 'error',
        })
      }
  }

  const loadDomains = async () => {
    try {
      const response = await backend.get('/domains');
      setDomains(response.data.join('\n'));
    } catch (error) {
      toast({
        title: 'Error loading domains',
        description: error,
        status: 'error',
      })
    }
  };

  const lookup = async (useCache) => {
      const domainsArray = domains.split('\n').filter(domain => domain.trim());
      setResults([]);
      setProgress(0);

      try {
        const response = await backend.post('/lookup', { domains: domainsArray, useCache });
        setResults(response.data);

        toast({
          title: 'Lookup successfull',
          status: 'success',
        })
      } catch (error) {
        toast({
          title: 'Error during lookup',
          description: error,
          status: 'error',
        })
      }

      setProgress(100);
  }

  const clearCache = async () => {
    try {
      await backend.post('/clear-cache');
      
      toast({
        title: 'Cache cleared successfully',
        status: 'success',
      })
    } catch (error) {
      toast({
        title: 'Error clear cache',
        description: error,
        status: 'error',
      })
    }
  }

  const startVpn = async () => {
      try {
        await backend.post('/start-vpn');
      } catch (error) {
        toast({
          title: 'Error start VPN',
          description: error,
          status: 'error',
        })
      }
  }

  const stopVpn = async () => {
      try {
        await backend.post('/stop-vpn');
      } catch (error) {
        toast({
          title: 'Error stop VPN',
          description: error,
          status: 'error',
        })
      }
  }

  const getInitialXrayStatus = async () => {
      try {
        const response = await backend.get('/xray-status');
        setXrayStatus(response.data.status);
        setVpnEnabled(response.data.status === 'running');
      } catch (error) {
        console.error('Error getting initial Xray status:', error);
      }
  }

  const getInitialCidrs = async () => {
    try {
      const response = await backend.get('/cidrs');
      setResults(response.data)
    } catch (error) {
      console.error('Error getting initial cidrs:', error);
    }
  }

  const applyRedirect = async () => {
    try {
      await backend.post('/apply-redirect');
      toast({
        title: 'Redirect rules applied successfully',
        status: 'success',
      })
    } catch (error) {
      toast({
        title: 'Error applying redirect rules',
        description: error,
        status: 'error',
      })
    }
  };

  return (
    <>
        <div className="container">
        <div className="input-section">

        <FormControl display='flex' alignItems='center' className='vpn-control'>
            <FormLabel htmlFor='enable-vpn' mb='0'>
                Enable VPN
            </FormLabel>
            <Switch onChange={(e) => e.target.checked === true ? startVpn() : stopVpn()} id='enable-vpn' isChecked={vpnEnabled} />
            <Tag className='vpn-status' colorScheme={statusColors[xrayStatus]}>{xrayStatus}</Tag>
        </FormControl>

            <Textarea className='domains-list' value={domains} onChange={(e) => setDomains(e.target.value)} placeholder="Enter domains, one per line" />
            
            <div className='domains-controls'>
                <Button onClick={saveDomains}>Save Domains</Button>
                <Button onClick={loadDomains}>Load Domains</Button>
                <Button onClick={() => lookup(true)}>Lookup (Use Cache)</Button>
                <Button onClick={() => lookup(false)}>Lookup (No Cache)</Button>
                <Button onClick={clearCache}>Clear Cache</Button>
                <Button onClick={applyRedirect}>Apply Redirect Rules</Button>
            </div>

            <Progress size='xs' value={progress} max="100" />
        </div>

        {results.length !== 0 && 
        <div className="results">
          {results.map((cidr, index) => (
            <div key={index}>{cidr}</div>
          ))}
        </div>
        }
    </div>
    </>
  );
};

export default Home;