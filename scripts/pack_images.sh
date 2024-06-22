#!/bin/bash

pwd

7z a -m0=lzma2 -mx=9 -mfb=64 -md=32m -ms=on -mhe=on -t7z "./../data/pack_images.7z" @"pack.lst"
