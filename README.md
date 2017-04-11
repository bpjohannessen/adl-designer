# Vagrant

My Vagrant template for a quick and easy webserver running Apache and PHP.
The setup forwards 8080 to 80 and 443 to 8443, and then symlinks the `/vagrant` folder to `/var/www/html` for an easy web development environment.
 
## Installation

### Windows 10 (Administrative cmd.exe)

```
cd <folder where to install vagrant machine>
choco install -y vagrant virtualbox git
git clone https://github.com/andmos/Vagrant-Webserver.git
vagrant up
vagrant ssh
```

### Linux (Ubuntu 16.04)

```
cd <folder where to install vagrant machine>
sudo apt-get install -y virtualbox vagrant git
git clone https://github.com/andmos/Vagrant-Webserver.git
vagrant up
vagrant ssh
```

## Currently tested setup:

**Windows 10**

* Vagrant 1.9.3
* VirtualBox 5.1.18

**Ubuntu 16.04**

* Vagrant 1.9.3
* VirtualBox 5.1.18