import os
import sys

if(len(sys.argv) != 3):
    print "Format: python hex_to_bin.py input.hex output.bin"
    sys.exit()

hex_file = sys.argv[1]
output_file = sys.argv[2]
f = open(hex_file, 'r')
bf = open(output_file, 'wb+')

data = bytearray()
for line in f:
    
    size_string = line[1]+line[2]
    addr_string = line[3]+line[4]+line[5]+line[6]
    record_type_string = line[7]+line[8]

    #If this row contains data
    if record_type_string == "00" and size_string == "10":
        addr_1 = int(addr_string, 16) >> 8
        addr_2 = int(addr_string, 16) & 0xff
        data.append(addr_1)
        data.append(addr_2)
        
        x = 0
        while x < 16:
            b_offset = 9+(x*2)
            byte_string = line[b_offset:(b_offset+2)]
            x = x+1
            byte = int(byte_string, 16) & 0xFF
            data.append(byte)
            
bf.write(data)      
f.close()
bf.close()
