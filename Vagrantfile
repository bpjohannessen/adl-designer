# -*- mode: ruby -*-
# vi: set ft=ruby :

VAGRANTFILE_API_VERSION = "2"

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
  config.vm.box = "geerlingguy/ubuntu1604"
  config.ssh.insert_key = false

  config.vm.provider :virtualbox do |v|
    v.name = "adlserverx"
    v.memory = 512
    v.cpus = 2
    v.customize ["modifyvm", :id, "--natdnshostresolver1", "on"]
    v.customize ["modifyvm", :id, "--ioapic", "on"]
  end

  config.vm.hostname = "adlserverx"
  config.vm.provision "shell", path: "BootStrap"
  config.vm.network "forwarded_port", guest: 80, host: 8081, host_ip: "127.0.0.1"
  config.vm.network "forwarded_port", guest: 443, host: 8444, host_ip: "127.0.0.1"

  # Set the name of the VM. See: http://stackoverflow.com/a/17864388/100134
  config.vm.define :adlserverx do |adlserverx|
  end

end