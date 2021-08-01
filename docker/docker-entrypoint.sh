#!/bin/sh

set -ex

npx gulp configure

exec $@
