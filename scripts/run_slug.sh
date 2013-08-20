#!/bin/sh

SLUG_HOST=$1
SLUG_ID=$2
PROCESS_UUID=$3
CMDLINE=$4

function process_alive()
{
  test -n $PID && kill -0 $PID 2>/dev/nill
}

function on_exit()
{
  echo "exit for pid $PID"

  if process_alive; then
    kill -TERM $PID
    n=50
    while process_alive && test $n -ge 0; do
      sleep 0.2 && n=$(( $n - 1 ))
    done

    if process_alive; then
      echo "Didn't die within 10 seconds, killing"
    fi

    kill -9 $PID
  fi

  umount $MOUNT_DIR/proc $MOUNT_DIR/dev/pts $MOUNT_DIR/dev $MOUNT_DIR/sys
  sleep 1
  umount $MOUNT_DIR
  rm -rf $MOUNT_DIR $OVERLAY_DIR
  exit 0
}

trap on_exit SIGTERM

CONTAINERS_ROOT=/root/griddle
BASE_DIR=$CONTAINERS_ROOT/lucid64
SLUG_DIR=$CONTAINERS_ROOT/slugs/$SLUG_ID

# Overlay is where we store any ephemeral changes to the slug during runtime
# Mount is just a mountpoint where it's all combined into and run from
OVERLAY_DIR=$CONTAINERS_ROOT/overlays/$PROCESS_UUID
MOUNT_DIR=$CONTAINERS_ROOT/mount_points/$PROCESS_UUID
mkdir -p $OVERLAY_DIR $MOUNT_DIR $OVERLAY_DIR/etc

#  Fetch the slug if it doesn't exist
if [[ ! -d $SLUG_DIR ]]; then
  mkdir -p $SLUG_DIR/app
  curl -s http://$SLUG_HOST/slugs/$SLUG_ID.tgz | tar -xzC $SLUG_DIR/app
fi

# Bootstrap networking from the host
cp -fLu /etc/hosts $OVERLAY_DIR/etc/
cp -fLu /etc/resolv.conf $OVERLAY_DIR/etc/

# Mount everything using unionfs. Top-most layer is first. copy-on-write is used to
# let us change anything in the system but only have those changes stored in the overlay
#
# /root/lucid64 is the tarball located at http://d1ame58wcmmrml.cloudfront.net/lucid64.tgz
# Install unionfs: http://grangerx.wordpress.com/2010/12/31/using-fuse-unionfs-with-centos-5-5-i686/
unionfs -oallow_root -ouid=0 -ogid=0 -ocow $OVERLAY_DIR=RW:$SLUG_DIR=RO:$BASE_DIR=RO $MOUNT_DIR

# Bind some resources needed from the host. This is the dangerous bit where processes
# can affect the underlying host. We trust our own code so this is fine - we're not
# looking for security, just a way to get a Ubuntu base on our RHEL kernel
mount -o bind /proc $MOUNT_DIR/proc
mount -o bind /dev $MOUNT_DIR/dev
mount -o bind /dev/pts $MOUNT_DIR/dev/pts
mount -o bind /sys $MOUNT_DIR/sys

/usr/sbin/chroot $MOUNT_DIR env HOME=/app bash -l -c "$CMDLINE & echo \$!>/my.pid"
PID=$(cat $OVERLAY_DIR/my.pid)

while process_alive; do
  sleep 0.1
done

on_exit