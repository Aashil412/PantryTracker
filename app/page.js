'use client'
import { useState, useEffect } from 'react';
import { firestore } from '@/firebase';
import { Box, Modal, Typography, Stack, TextField, Button, Card, CardContent, Grid, CardActions, IconButton, useTheme } from '@mui/material';
import { collection, deleteDoc, doc, getDocs, query, getDoc, setDoc } from 'firebase/firestore';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

export default function Home() {
  const [inventory, setInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [updateOpen, setUpdateOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState({ name: '', quantity: 0 });
  const [searchQuery, setSearchQuery] = useState('');

  const theme = useTheme();

  const updateInventory = async () => {
    console.log('Updating inventory');
    const snapshot = query(collection(firestore, 'inventory'));
    const docs = await getDocs(snapshot);
    const inventoryList = [];
    docs.forEach((doc) => {
      inventoryList.push({
        name: doc.id,
        ...doc.data(),
      });
    });
    console.log('Inventory:', inventoryList);
    setInventory(inventoryList);
  };

  const addItem = async (item) => {
    console.log('Adding item:', item);

    if (!item) {
      console.log('No item name provided');
      return;
    }

    try {
      const docRef = doc(collection(firestore, 'inventory'), item);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const { quantity } = docSnap.data();
        console.log('Item exists, updating quantity:', quantity + 1);
        await setDoc(docRef, { quantity: quantity + 1 });
      } else {
        console.log('Item does not exist, adding new item with quantity 1');
        await setDoc(docRef, { quantity: 1 });
      }

      await updateInventory();
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const removeItem = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      if (quantity > 1) {
        await setDoc(docRef, { quantity: quantity - 1 });
      } else {
        await deleteDoc(docRef);
      }
    }

    await updateInventory();
  };

  const updateItem = async () => {
    const docRef = doc(collection(firestore, 'inventory'), currentItem.name);
    await setDoc(docRef, { quantity: currentItem.quantity });
    await updateInventory();
    setUpdateOpen(false);
  };

  useEffect(() => {
    updateInventory();
  }, []);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const handleUpdateOpen = (item) => {
    setCurrentItem(item);
    setUpdateOpen(true);
  };
  const handleUpdateClose = () => setUpdateOpen(false);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    borderRadius: 2,
    boxShadow: 24,
    p: 4,
  };

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      alignItems="center"
      p={4}
      gap={4}
      sx={{ backgroundColor: theme.palette.background.default }}
    >
      <Typography variant="h3" color="primary" gutterBottom>
        Inventory Management
      </Typography>

      <TextField
        label="Search Inventory"
        variant="outlined"
        fullWidth
        value={searchQuery}
        onChange={handleSearch}
        sx={{ maxWidth: 600, mb: 4 }}
      />

      <Button
        variant="contained"
        color="primary"
        startIcon={<AddCircleOutlineIcon />}
        onClick={handleOpen}
        sx={{ mb: 4 }}
      >
        Add New Item
      </Button>

      <Grid container spacing={3} justifyContent="center">
        {filteredInventory.map(({ name, quantity }) => (
          <Grid item key={name} xs={12} sm={6} md={4} lg={3}>
            <Card sx={{ backgroundColor: theme.palette.background.paper, boxShadow: 3 }}>
              <CardContent>
                <Typography variant="h5" component="div">
                  {name.charAt(0).toUpperCase() + name.slice(1)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Quantity: {quantity}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'space-between' }}>
                <IconButton
                  color="primary"
                  onClick={() => handleUpdateOpen({ name, quantity })}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  color="secondary"
                  onClick={() => removeItem(name)}
                >
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Add Item
          </Typography>
          <Stack width="100%" direction="row" spacing={2} mt={2}>
            <TextField
              id="outlined-basic"
              label="Item"
              variant="outlined"
              fullWidth
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
            />
            <Button
              variant="contained"
              onClick={() => {
                addItem(itemName);
                setItemName('');
                handleClose();
              }}
            >
              Add
            </Button>
          </Stack>
        </Box>
      </Modal>

      <Modal
        open={updateOpen}
        onClose={handleUpdateClose}
        aria-labelledby="update-modal-title"
        aria-describedby="update-modal-description"
      >
        <Box sx={style}>
          <Typography id="update-modal-title" variant="h6" component="h2">
            Update Item
          </Typography>
          <Stack width="100%" direction="row" spacing={2} mt={2}>
            <TextField
              id="outlined-basic"
              label="Quantity"
              type="number"
              variant="outlined"
              fullWidth
              value={currentItem.quantity}
              onChange={(e) => setCurrentItem({ ...currentItem, quantity: e.target.value })}
            />
            <Button
              variant="contained"
              onClick={updateItem}
            >
              Update
            </Button>
          </Stack>
        </Box>
      </Modal>
    </Box>
  );
}
